import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { invoices, customers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import Decimal from 'decimal.js';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  try {
    console.log('[Recent Invoices] Team ID:', team.id);

    // Get the 5 most recent invoices with customer details
    const recentInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        totalAmount: invoices.totalAmount,
        status: invoices.status,
        paymentStatus: invoices.paymentStatus,
        currency: invoices.currency,
        customerName: customers.name,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.teamId, team.id))
      .orderBy(desc(invoices.createdAt))
      .limit(5);

    console.log('[Recent Invoices] Found', recentInvoices.length, 'recent invoices');

    // Format the data
    const formattedData = recentInvoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.invoiceNumber,
      customerName: invoice.customerName,
      amount: new Decimal(invoice.totalAmount).toNumber(),
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      date: format(new Date(invoice.invoiceDate), 'MMM dd, yyyy'),
      currency: invoice.currency,
    }));

    console.log('[Recent Invoices] Returning data:', formattedData);

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Recent invoices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent invoices data' },
      { status: 500 }
    );
  }
});