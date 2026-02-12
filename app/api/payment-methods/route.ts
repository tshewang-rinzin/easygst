import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getPaymentMethods } from '@/lib/payment-methods/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const methods = await getPaymentMethods();
    return NextResponse.json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
});
