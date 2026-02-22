import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { paymentQrCodes, invoices } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generatePaymentQR } from '@/lib/bank';
import { generateQRDataURL } from '@/lib/bank/qr-utils';

// GET /api/invoices/[id]/payment-qr — Get existing payment QR for invoice
export const GET = withAuth(async (_request: NextRequest, { team, params }) => {
  try {
    const { id } = params;

    const [qr] = await db
      .select()
      .from(paymentQrCodes)
      .where(and(eq(paymentQrCodes.invoiceId, id), eq(paymentQrCodes.teamId, team.id)))
      .orderBy(paymentQrCodes.createdAt)
      .limit(1);

    if (!qr) {
      return NextResponse.json({ error: 'No payment QR found for this invoice' }, { status: 404 });
    }

    return NextResponse.json({
      id: qr.id,
      qrData: qr.qrData,
      qrImageUrl: qr.qrImageUrl,
      referenceId: qr.referenceId,
      status: qr.status,
      amount: qr.amount,
      currency: qr.currency,
      expiresAt: qr.expiresAt,
      paidAt: qr.paidAt,
      createdAt: qr.createdAt,
    });
  } catch (error) {
    console.error('Error fetching payment QR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// POST /api/invoices/[id]/payment-qr — Generate payment QR code for invoice
export const POST = withAuth(async (_request: NextRequest, { team, params }) => {
  try {
    const { id } = params;

    // Verify invoice belongs to team
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.teamId, team.id)))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid' || invoice.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    const result = await generatePaymentQR(team.id, id);

    // Generate QR image data URL
    const qrImageDataUrl = await generateQRDataURL(result.qrData);

    return NextResponse.json({
      qrData: result.qrData,
      qrImageUrl: result.qrImageUrl || qrImageDataUrl,
      referenceId: result.referenceId,
      expiresAt: result.expiresAt,
    });
  } catch (error: any) {
    console.error('Error generating payment QR:', error);
    const message = error?.message || 'Internal server error';
    const status = message.includes('not found') || message.includes('No active') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
});
