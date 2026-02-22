import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import { invoices, customers, messageLog } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { sendWhatsApp, isValidE164 } from '@/lib/messaging';
import { receiptMessage } from '@/lib/messaging/templates';

const bodySchema = z.object({
  phone: z.string(),
});

export const POST = withMobileAuth(async (request: NextRequest, context: MobileAuthContext & { params?: any }) => {
  const receiptId = context.params?.id;
  if (!receiptId) {
    return NextResponse.json({ error: 'Receipt ID required' }, { status: 400 });
  }

  const body = bodySchema.parse(await request.json());

  if (!isValidE164(body.phone)) {
    return NextResponse.json({ error: 'Invalid phone number. Use E.164 format (e.g. +97517123456)' }, { status: 400 });
  }

  const [receipt] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, receiptId), eq(invoices.teamId, context.team.id)))
    .limit(1);

  if (!receipt) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
  }

  const message = receiptMessage({
    businessName: context.team.businessName || context.team.name,
    receiptNumber: receipt.invoiceNumber,
    totalAmount: parseFloat(receipt.totalAmount).toLocaleString(),
    paymentMethod: 'Cash',
  });

  const result = await sendWhatsApp(body.phone, message);

  await db.insert(messageLog).values({
    teamId: context.team.id,
    invoiceId: receipt.id,
    channel: 'whatsapp',
    recipient: body.phone,
    messageType: 'receipt',
    status: result.success ? 'sent' : 'failed',
    providerMessageId: result.messageId,
    content: message,
    error: result.error,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Failed to send WhatsApp message' }, { status: 500 });
  }

  return NextResponse.json({ success: true, messageId: result.messageId });
});
