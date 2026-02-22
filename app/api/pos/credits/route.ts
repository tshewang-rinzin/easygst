import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import { invoices, customers, payments } from '@/lib/db/schema';
import { eq, and, gt, sql, or } from 'drizzle-orm';
import Decimal from 'decimal.js';

export const GET = withMobileAuth(async (request: NextRequest, context: MobileAuthContext) => {
  const teamId = context.team.id;

  // Get all unpaid/partially paid invoices
  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      date: invoices.invoiceDate,
      totalAmount: invoices.totalAmount,
      amountPaid: invoices.amountPaid,
      amountDue: invoices.amountDue,
      customerId: invoices.customerId,
      customerName: customers.name,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(
      and(
        eq(invoices.teamId, teamId),
        or(eq(invoices.status, 'sent'), eq(invoices.paymentStatus, 'unpaid'), eq(invoices.paymentStatus, 'partial')),
        gt(sql`CAST(${invoices.amountDue} AS numeric)`, 0)
      )
    );

  // Group by customer
  const customerMap = new Map<string, {
    customerId: string;
    customerName: string;
    totalOutstanding: Decimal;
    invoices: Array<{ id: string; invoiceNumber: string; date: Date | null; amount: string; amountPaid: string; amountDue: string }>;
  }>();

  for (const row of rows) {
    if (!customerMap.has(row.customerId)) {
      customerMap.set(row.customerId, {
        customerId: row.customerId,
        customerName: row.customerName || 'Unknown',
        totalOutstanding: new Decimal(0),
        invoices: [],
      });
    }
    const entry = customerMap.get(row.customerId)!;
    entry.totalOutstanding = entry.totalOutstanding.plus(row.amountDue);
    entry.invoices.push({
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      date: row.date,
      amount: row.totalAmount,
      amountPaid: row.amountPaid,
      amountDue: row.amountDue,
    });
  }

  const credits = Array.from(customerMap.values()).map((c) => ({
    ...c,
    totalOutstanding: c.totalOutstanding.toFixed(2),
    invoiceCount: c.invoices.length,
  }));

  return NextResponse.json({ credits });
});
