import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getCustomerPayments } from '@/lib/customer-payments/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const payments = await getCustomerPayments();
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer payments' },
      { status: 500 }
    );
  }
});
