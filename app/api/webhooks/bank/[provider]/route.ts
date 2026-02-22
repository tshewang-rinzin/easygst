import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { paymentQrCodes, invoices, payments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getProvider } from '@/lib/bank';

// POST /api/webhooks/bank/[provider] — Receive payment notification from bank (NO auth)
export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider: providerCode } = await params;

    const provider = getProvider(providerCode);
    if (!provider || !provider.handleWebhook) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    const payload = await request.json();

    // TODO: Extract webhook secret from request headers and validate
    // For now, pass empty string — real implementation should validate signature
    const paymentStatus = await provider.handleWebhook(payload, '');

    if (!paymentStatus) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    // Find the QR code record by reference ID
    const [qrRecord] = await db
      .select()
      .from(paymentQrCodes)
      .where(eq(paymentQrCodes.referenceId, paymentStatus.referenceId))
      .limit(1);

    if (!qrRecord) {
      console.warn(`[bank-webhook] QR record not found for ref: ${paymentStatus.referenceId}`);
      return NextResponse.json({ status: 'ignored', reason: 'reference not found' });
    }

    // Update QR code status
    await db
      .update(paymentQrCodes)
      .set({
        status: paymentStatus.status,
        paidAt: paymentStatus.paidAt ?? null,
        metadata: paymentStatus.metadata ?? null,
        updatedAt: new Date(),
      })
      .where(eq(paymentQrCodes.id, qrRecord.id));

    // If paid, auto-mark invoice as paid and create payment record
    if (paymentStatus.status === 'paid' && paymentStatus.paidAmount) {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, qrRecord.invoiceId))
        .limit(1);

      if (invoice) {
        const paidAmount = paymentStatus.paidAmount;
        const newAmountPaid = Number(invoice.amountPaid) + paidAmount;
        const newAmountDue = Number(invoice.totalAmount) - newAmountPaid;

        const isPaid = newAmountDue <= 0;

        await db
          .update(invoices)
          .set({
            amountPaid: String(newAmountPaid),
            amountDue: String(Math.max(0, newAmountDue)),
            paymentStatus: isPaid ? 'paid' : 'partial',
            status: isPaid ? 'paid' : invoice.status,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoice.id));

        // Create payment record
        // Note: createdBy uses a system placeholder — webhook has no user context
        // TODO: Create a system user or use a different approach for webhook-created payments
        await db.insert(payments).values({
          teamId: qrRecord.teamId,
          invoiceId: invoice.id,
          amount: String(paidAmount),
          currency: qrRecord.currency,
          paymentDate: paymentStatus.paidAt ?? new Date(),
          paymentMethod: 'bank_qr',
          transactionId: paymentStatus.transactionId ?? paymentStatus.referenceId,
          notes: `Auto-recorded via ${providerCode} bank QR payment`,
          createdBy: invoice.createdBy, // Fallback to invoice creator
        });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[bank-webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
