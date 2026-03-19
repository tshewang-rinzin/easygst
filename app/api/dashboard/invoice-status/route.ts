import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { invoices } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import Decimal from 'decimal.js';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  try {
    console.log('[Invoice Status] Team ID:', team.id);

    // Get invoice count and total amount by status
    const statusData = await db
      .select({
        status: invoices.status,
        count: sql<number>`COUNT(*)`,
        totalAmount: sql<string>`SUM(${invoices.totalAmount})`,
      })
      .from(invoices)
      .where(eq(invoices.teamId, team.id))
      .groupBy(invoices.status)
      .orderBy(invoices.status);

    console.log('[Invoice Status] Found', statusData.length, 'status groups');

    // Format the data for pie chart
    const formattedData = statusData.map((item) => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1), // Capitalize first letter
      value: item.count,
      amount: new Decimal(item.totalAmount || '0').toNumber(),
    }));

    // Ensure we have at least some structure for empty states
    if (formattedData.length === 0) {
      formattedData.push({
        name: 'No Data',
        value: 0,
        amount: 0,
      });
    }

    console.log('[Invoice Status] Returning data:', formattedData);

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Invoice status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice status data' },
      { status: 500 }
    );
  }
});