import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getCustomerAdvances, getCustomerUnallocatedAdvances } from '@/lib/customer-payments/queries';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const unallocatedOnly = searchParams.get('unallocatedOnly') === 'true';

    const advances = unallocatedOnly
      ? await getCustomerUnallocatedAdvances(id)
      : await getCustomerAdvances(id);

    return NextResponse.json(advances);
  } catch (error) {
    console.error('Error fetching customer advances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advances' },
      { status: 500 }
    );
  }
});
