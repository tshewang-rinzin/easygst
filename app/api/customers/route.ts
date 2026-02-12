import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getCustomers } from '@/lib/customers/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const customers = await getCustomers();
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
});
