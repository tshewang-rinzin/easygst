import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getGstReturns } from '@/lib/gst/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const returns = await getGstReturns();
    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching GST returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GST returns' },
      { status: 500 }
    );
  }
});
