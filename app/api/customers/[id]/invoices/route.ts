import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { invoices } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const GET = withAuth(async (request: NextRequest, { team, params }) => {
  try {
    const customerId = params.id;

    const customerInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        totalAmount: invoices.totalAmount,
        amountDue: invoices.amountDue,
        currency: invoices.currency,
        status: invoices.status,
        paymentStatus: invoices.paymentStatus,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.teamId, team.id),
          eq(invoices.customerId, customerId)
        )
      )
      .orderBy(desc(invoices.invoiceDate));

    return NextResponse.json(customerInvoices);
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer invoices' },
      { status: 500 }
    );
  }
});
