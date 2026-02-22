import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import { invoices, payments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Decimal from 'decimal.js';

const paySchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'qr']),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export const POST = withMobileAuth(async (request: NextRequest, context: MobileAuthContext & { params?: any }) => {
  try {
    const invoiceId = context.params?.id;
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = paySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { amount, paymentMethod, transactionId, notes } = parsed.data;
    const teamId = context.team.id;
    const userId = context.user.id;

    // Get invoice
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.teamId, teamId)))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const amountDue = new Decimal(invoice.amountDue);
    if (amountDue.lessThanOrEqualTo(0)) {
      return NextResponse.json({ error: 'Invoice is already fully paid' }, { status: 400 });
    }

    const paymentAmount = new Decimal(amount);
    const actualPayment = paymentAmount.greaterThan(amountDue) ? amountDue : paymentAmount;
    const newAmountPaid = new Decimal(invoice.amountPaid).plus(actualPayment);
    const newAmountDue = new Decimal(invoice.totalAmount).minus(newAmountPaid);
    const fullyPaid = newAmountDue.lessThanOrEqualTo(0);

    await db.transaction(async (tx) => {
      // Record payment
      await tx.insert(payments).values({
        teamId,
        invoiceId,
        amount: actualPayment.toFixed(2),
        currency: invoice.currency,
        paymentDate: new Date(),
        paymentMethod,
        transactionId: transactionId || null,
        notes: notes || 'POS Credit Payment',
        createdBy: userId,
      });

      // Update invoice
      await tx
        .update(invoices)
        .set({
          amountPaid: newAmountPaid.toFixed(2),
          amountDue: newAmountDue.greaterThan(0) ? newAmountDue.toFixed(2) : '0.00',
          status: fullyPaid ? 'paid' : 'sent',
          paymentStatus: fullyPaid ? 'paid' : 'partial',
          isLocked: fullyPaid ? true : invoice.isLocked,
          lockedAt: fullyPaid ? new Date() : invoice.lockedAt,
          lockedBy: fullyPaid ? userId : invoice.lockedBy,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId));
    });

    return NextResponse.json({
      success: true,
      remainingBalance: newAmountDue.greaterThan(0) ? newAmountDue.toFixed(2) : '0.00',
      invoiceStatus: fullyPaid ? 'paid' : 'sent',
    });
  } catch (error) {
    console.error('[pos/credits/pay] Error:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
});
