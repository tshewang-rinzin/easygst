import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { quotations, customers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  try {
    const results = await db
      .select({
        id: quotations.id,
        quotationNumber: quotations.quotationNumber,
        quotationDate: quotations.quotationDate,
        validUntil: quotations.validUntil,
        status: quotations.status,
        currency: quotations.currency,
        totalAmount: quotations.totalAmount,
        customer: customers,
      })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .where(eq(quotations.teamId, team.id))
      .orderBy(desc(quotations.quotationDate));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
});
