import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getCustomerPaymentWithDetails } from '@/lib/customer-payments/queries';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;

    const payment = await getCustomerPaymentWithDetails(id);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching customer payment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
});
