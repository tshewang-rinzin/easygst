import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getSubscriptionWithPlan, getPaymentHistory } from '@/lib/subscriptions';
import { getTeamPlan } from '@/lib/features';

export const GET = withAuth(async (request, { team }) => {
  const subscriptionData = await getSubscriptionWithPlan(team.id);
  const payments = await getPaymentHistory(team.id);
  const currentPlan = await getTeamPlan(team.id);

  return NextResponse.json({
    subscription: subscriptionData?.subscription ?? null,
    plan: subscriptionData?.plan ?? currentPlan ?? null,
    payments,
  });
});
