import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getSubscriptionStats } from '@/lib/subscriptions/queries';

export const GET = withAuth(async () => {
  try {
    const stats = await getSubscriptionStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
});
