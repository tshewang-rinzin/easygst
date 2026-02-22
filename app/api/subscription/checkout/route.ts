import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { createSubscription } from '@/lib/subscriptions';
import { getPaymentGateway } from '@/lib/payments';
import { db } from '@/lib/db/drizzle';
import { plans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST = withAuth(async (request, { team }) => {
  try {
    const body = await request.json();
    const { planId, billingCycle } = body;

    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: 'planId and billingCycle are required' },
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'billingCycle must be "monthly" or "yearly"' },
        { status: 400 }
      );
    }

    // Get the plan
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Plan not found or inactive' },
        { status: 404 }
      );
    }

    const amount = billingCycle === 'monthly'
      ? parseFloat(plan.monthlyPrice || '0')
      : parseFloat(plan.yearlyPrice || '0');

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'This plan has no pricing for the selected billing cycle' },
        { status: 400 }
      );
    }

    // Create subscription + payment record
    const { subscription, payment } = await createSubscription(
      team.id,
      planId,
      billingCycle as 'monthly' | 'yearly',
      amount
    );

    // Initiate payment
    const gateway = getPaymentGateway();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const result = await gateway.initiate({
      amount,
      currency: 'BTN',
      description: `${plan.name} Plan - ${billingCycle} subscription`,
      returnUrl: `${baseUrl}/api/subscription/callback?payment_id=${payment.id}&subscription_id=${subscription.id}`,
      cancelUrl: `${baseUrl}/settings/subscription?cancelled=true`,
      metadata: {
        teamId: team.id,
        planId,
        subscriptionId: subscription.id,
        billingCycle,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to initiate payment' },
        { status: 500 }
      );
    }

    // Store transaction ID on payment record
    if (result.transactionId) {
      const { subscriptionPayments } = await import('@/lib/db/schema');
      await db
        .update(subscriptionPayments)
        .set({ transactionId: result.transactionId })
        .where(eq(subscriptionPayments.id, payment.id));
    }

    return NextResponse.json({
      paymentUrl: result.paymentUrl,
      transactionId: result.transactionId,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('[Subscription Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
});
