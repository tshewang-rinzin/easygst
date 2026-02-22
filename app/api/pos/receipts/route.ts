import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import { invoices, customers, payments } from '@/lib/db/schema';
import { eq, and, desc, gte, lt, sql, or } from 'drizzle-orm';

export const GET = withMobileAuth(async (request: NextRequest, context: MobileAuthContext) => {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');
  const dateStr = searchParams.get('date');
  const type = searchParams.get('type') || 'all';
  const teamId = context.team.id;

  const conditions = [eq(invoices.teamId, teamId)];

  // Filter by date
  if (dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    conditions.push(gte(invoices.invoiceDate, date));
    conditions.push(lt(invoices.invoiceDate, nextDay));
  }

  // Filter by type
  if (type === 'paid') {
    conditions.push(eq(invoices.status, 'paid'));
  } else if (type === 'credit') {
    conditions.push(or(eq(invoices.status, 'sent'), eq(invoices.paymentStatus, 'unpaid'))!);
  }

  // Only show POS-created invoices (those with POS payment terms pattern)
  conditions.push(
    or(
      sql`${invoices.paymentTerms} LIKE 'POS%'`,
      sql`${invoices.paymentTerms} LIKE 'Cash Sale%'`
    )!
  );

  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      date: invoices.invoiceDate,
      customerName: customers.name,
      totalAmount: invoices.totalAmount,
      amountPaid: invoices.amountPaid,
      amountDue: invoices.amountDue,
      status: invoices.status,
      paymentStatus: invoices.paymentStatus,
      paymentTerms: invoices.paymentTerms,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(invoices.createdAt))
    .limit(limit)
    .offset(offset);

  const receipts = rows.map((row) => ({
    ...row,
    isCredit: row.status === 'sent' || row.paymentStatus === 'unpaid',
  }));

  return NextResponse.json({ receipts });
});
