import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import { paymentQrCodes, invoices } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generatePaymentQR } from '@/lib/bank';
import { generateQRDataURL } from '@/lib/bank/qr-utils';

// GET /api/pos/invoices/[id]/payment-qr — Get payment QR for POS mobile app
export const GET = withMobileAuth(async (request: NextRequest, context: MobileAuthContext & { params?: any }) => {
  try {
    const { id } = context.params;
    const teamId = context.team.id;

    const [qr] = await db
      .select()
      .from(paymentQrCodes)
      .where(and(eq(paymentQrCodes.invoiceId, id), eq(paymentQrCodes.teamId, teamId)))
      .orderBy(paymentQrCodes.createdAt)
      .limit(1);

    if (!qr) {
      // Auto-generate if not exists
      try {
        const result = await generatePaymentQR(teamId, id);
        const qrImageDataUrl = await generateQRDataURL(result.qrData);

        return NextResponse.json({
          qrData: result.qrData,
          qrImageUrl: result.qrImageUrl || qrImageDataUrl,
          referenceId: result.referenceId,
          status: 'pending',
          expiresAt: result.expiresAt,
        });
      } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Failed to generate QR' }, { status: 400 });
      }
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
    });
  } catch (error) {
    console.error('Error fetching payment QR (POS):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
