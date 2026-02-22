import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getCurrentSubscription, cancelSubscription } from '@/lib/subscriptions';

export const POST = withAuth(async (request, { team }) => {
  try {
    const subscription = await getCurrentSubscription(team.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      );
    }

    await cancelSubscription(subscription.id);

    return NextResponse.json({
      message: 'Subscription cancelled. It will remain active until the end of the current billing period.',
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error('[Subscription Cancel] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
});
