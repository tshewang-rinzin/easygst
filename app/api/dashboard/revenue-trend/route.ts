import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { invoices } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import Decimal from 'decimal.js';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  try {
    console.log('[Revenue Trend] Team ID:', team.id);

    // Get the last 6 months including current month
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5); // 5 months ago to include current month = 6 total

    // Get monthly revenue data grouped by month for paid invoices
    const monthlyData = await db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${invoices.invoiceDate})`,
        month: sql<number>`EXTRACT(MONTH FROM ${invoices.invoiceDate})`,
        revenue: sql<string>`SUM(${invoices.totalAmount})`,
        invoiceCount: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.teamId, team.id),
          eq(invoices.status, 'paid'),
          gte(invoices.invoiceDate, startOfMonth(sixMonthsAgo)),
          lte(invoices.invoiceDate, endOfMonth(now))
        )
      )
      .groupBy(
        sql`EXTRACT(YEAR FROM ${invoices.invoiceDate})`,
        sql`EXTRACT(MONTH FROM ${invoices.invoiceDate})`
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${invoices.invoiceDate})`,
        sql`EXTRACT(MONTH FROM ${invoices.invoiceDate})`
      );

    console.log('[Revenue Trend] Found', monthlyData.length, 'months with revenue');

    // Create a map for easy lookup
    const dataMap = new Map(
      monthlyData.map((item) => [
        `${item.year}-${item.month.toString().padStart(2, '0')}`,
        {
          revenue: new Decimal(item.revenue || '0').toNumber(),
          invoiceCount: item.invoiceCount,
        },
      ])
    );

    // Generate last 6 months array with 0 values for months without data
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM');
      
      const data = dataMap.get(monthKey) || { revenue: 0, invoiceCount: 0 };
      
      trendData.push({
        month: monthLabel,
        revenue: data.revenue,
        invoiceCount: data.invoiceCount,
      });
    }

    console.log('[Revenue Trend] Returning data:', trendData);

    return NextResponse.json(trendData);
  } catch (error) {
    console.error('Revenue trend error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue trend data' },
      { status: 500 }
    );
  }
});