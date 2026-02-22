import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { invoices, customers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  try {
    const results = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        status: invoices.status,
        currency: invoices.currency,
        totalAmount: invoices.totalAmount,
        amountDue: invoices.amountDue,
        customer: customers,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.teamId, team.id))
      .orderBy(desc(invoices.invoiceDate));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
});
