import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { supplierBills } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, desc } from 'drizzle-orm';

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id: supplierId } = await context.params;
    const team = await getTeamForUser();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 401 });
    }

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
}
