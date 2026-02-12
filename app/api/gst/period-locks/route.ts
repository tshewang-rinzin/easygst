import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getPeriodLocks } from '@/lib/gst/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const locks = await getPeriodLocks();
    return NextResponse.json(locks);
  } catch (error) {
    console.error('Error fetching period locks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch period locks' },
      { status: 500 }
    );
  }
});
