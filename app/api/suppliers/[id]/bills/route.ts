import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { supplierBills } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const GET = withAuth(async (request: NextRequest, { team, params }) => {
  try {
    const supplierId = params.id;

    const bills = await db
      .select({
        id: supplierBills.id,
        billNumber: supplierBills.billNumber,
        billDate: supplierBills.billDate,
        totalAmount: supplierBills.totalAmount,
        amountDue: supplierBills.amountDue,
        currency: supplierBills.currency,
        status: supplierBills.status,
        paymentStatus: supplierBills.paymentStatus,
      })
      .from(supplierBills)
      .where(
        and(
          eq(supplierBills.teamId, team.id),
          eq(supplierBills.supplierId, supplierId)
        )
      )
      .orderBy(desc(supplierBills.billDate));

    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error fetching supplier bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier bills' },
      { status: 500 }
    );
  }
});
