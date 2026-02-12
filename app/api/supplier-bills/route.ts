import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getSupplierBills } from '@/lib/supplier-bills/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const bills = await getSupplierBills();
    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error fetching supplier bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier bills' },
      { status: 500 }
    );
  }
});
