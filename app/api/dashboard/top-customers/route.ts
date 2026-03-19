import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { invoices, customers } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import Decimal from 'decimal.js';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  try {
    console.log('[Top Customers] Team ID:', team.id);

    // Get top 5 customers by revenue from paid invoices
    const topCustomers = await db
      .select({
        customerId: invoices.customerId,
        customerName: customers.name,
        revenue: sql<string>`SUM(${invoices.totalAmount})`,
        invoiceCount: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(
        and(
          eq(invoices.teamId, team.id),
          eq(invoices.status, 'paid')
        )
      )
      .groupBy(invoices.customerId, customers.name)
      .orderBy(desc(sql`SUM(${invoices.totalAmount})`))
      .limit(5);

    console.log('[Top Customers] Found', topCustomers.length, 'customers');

    // Format the data
    const formattedData = topCustomers.map((customer) => ({
      name: customer.customerName,
      revenue: new Decimal(customer.revenue || '0').toNumber(),
      invoiceCount: customer.invoiceCount,
    }));

    console.log('[Top Customers] Returning data:', formattedData);

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Top customers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top customers data' },
      { status: 500 }
    );
  }
});