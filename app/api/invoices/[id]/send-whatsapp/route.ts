import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { invoices, customers, messageLog } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { sendWhatsApp, isValidE164 } from '@/lib/messaging';
import { invoiceMessage } from '@/lib/messaging/templates';
import { getTeamFeatures } from '@/lib/features';

const bodySchema = z.object({
  phone: z.string().optional(),
});

export const POST = withAuth(async (request: NextRequest, context) => {
  const invoiceId = context.params?.id;
  if (!invoiceId) {
    return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
  }

  // Check feature flag
  const features = await getTeamFeatures(context.team.id);
  if (!features.has('whatsapp_notifications')) {
    return NextResponse.json({ error: 'WhatsApp notifications not available on your plan' }, { status: 403 });
  }

  const body = bodySchema.parse(await request.json());

  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.teamId, context.team.id)),
    with: { customer: true, team: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const phone = body.phone || invoice.customer.mobile || invoice.customer.phone;
  if (!phone) {
    return NextResponse.json({ error: 'No phone number available. Provide a phone number or add one to the customer.' }, { status: 400 });
  }

  if (!isValidE164(phone)) {
    return NextResponse.json({ error: 'Invalid phone number. Use E.164 format (e.g. +97517123456)' }, { status: 400 });
  }

  const businessName = invoice.team.businessName || invoice.team.name;
  const pdfUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${invoice.id}/pdf`
    : undefined;

  const message = invoiceMessage({
    businessName,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customer.name,
    totalAmount: parseFloat(invoice.totalAmount).toLocaleString(),
    dueDate: invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Upon receipt',
  });

  const result = await sendWhatsApp(phone, message, pdfUrl);

  await db.insert(messageLog).values({
    teamId: context.team.id,
    invoiceId: invoice.id,
    channel: 'whatsapp',
    recipient: phone,
    messageType: 'invoice',
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
