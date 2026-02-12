import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getSupplierOutstandingBills } from '@/lib/supplier-payments/queries';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;

    const bills = await getSupplierOutstandingBills(id);

    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error fetching outstanding bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outstanding bills' },
      { status: 500 }
    );
  }
});
