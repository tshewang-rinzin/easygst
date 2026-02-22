import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { supplierBills, supplierBillItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET = withAuth(async (request: NextRequest, { team, params }) => {
  try {
    // Get bill
    const [bill] = await db
      .select()
      .from(supplierBills)
      .where(
        and(
          eq(supplierBills.id, params.id),
          eq(supplierBills.teamId, team.id)
        )
      )
      .limit(1);

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Get bill items
    const items = await db
      .select()
      .from(supplierBillItems)
      .where(eq(supplierBillItems.billId, params.id))
      .orderBy(supplierBillItems.sortOrder);

    return NextResponse.json({ bill, items });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bill' },
      { status: 500 }
    );
  }
});
