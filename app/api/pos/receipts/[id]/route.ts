import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import { invoices, invoiceItems, customers, payments, products, teams } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET = withMobileAuth(async (request: NextRequest, context: MobileAuthContext & { params?: any }) => {
  const invoiceId = context.params?.id;
  if (!invoiceId) {
    return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
  }

  const teamId = context.team.id;

  // Get invoice
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.teamId, teamId)))
    .limit(1);

  if (!invoice) {
    return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
  }

  // Get items
  const items = await db
    .select({
      id: invoiceItems.id,
      description: invoiceItems.description,
      quantity: invoiceItems.quantity,
      unit: invoiceItems.unit,
      unitPrice: invoiceItems.unitPrice,
      lineTotal: invoiceItems.lineTotal,
      discountPercent: invoiceItems.discountPercent,
      discountAmount: invoiceItems.discountAmount,
      taxRate: invoiceItems.taxRate,
      taxAmount: invoiceItems.taxAmount,
      itemTotal: invoiceItems.itemTotal,
      productId: invoiceItems.productId,
      productName: products.name,
    })
    .from(invoiceItems)
    .leftJoin(products, eq(invoiceItems.productId, products.id))
    .where(eq(invoiceItems.invoiceId, invoiceId));

  // Get customer
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, invoice.customerId))
    .limit(1);

  // Get payments
  const paymentRecords = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId));

  // Get team info for receipt header
  const [team] = await db
    .select({
      businessName: teams.businessName,
      address: teams.address,
      phone: teams.phone,
      tpn: teams.tpn,
    })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  return NextResponse.json({
    receipt: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.invoiceDate,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      isCredit: invoice.status === 'sent' || invoice.paymentStatus === 'unpaid',
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      totalDiscount: invoice.totalDiscount,
      totalTax: invoice.totalTax,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      notes: invoice.notes,
      items,
      customer: customer
        ? { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email }
        : null,
      payments: paymentRecords.map((p) => ({
        id: p.id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate,
        transactionId: p.transactionId,
      })),
      business: team,
    },
  });
});
