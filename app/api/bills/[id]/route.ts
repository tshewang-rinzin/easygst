import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { supplierBills, supplierBillItems } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const team = await getTeamForUser();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 401 });
    }

    // Get bill
    const [bill] = await db
      .select()
      .from(supplierBills)
      .where(
        and(
          eq(supplierBills.id, id),
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
      .where(eq(supplierBillItems.billId, id))
      .orderBy(supplierBillItems.sortOrder);

    return NextResponse.json({ bill, items });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bill' },
      { status: 500 }
    );
  }
}
