'use server';

import { db } from '@/lib/db/drizzle';
import { subscriptions, subscriptionPayments, teams, plans } from '@/lib/db/schema';
import { eq, and, lte, or } from 'drizzle-orm';

/**
 * Get the current active (or cancelled-but-not-expired) subscription for a team.
 */
export async function getCurrentSubscription(teamId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.teamId, teamId),
        or(
          eq(subscriptions.status, 'active'),
          eq(subscriptions.status, 'cancelled'),
          eq(subscriptions.status, 'past_due')
        )
      )
    )
    .orderBy(subscriptions.createdAt)
    .limit(1);
  return sub ?? null;
}

/**
 * Get subscription with plan details.
 */
export async function getSubscriptionWithPlan(teamId: string) {
  const result = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(
        eq(subscriptions.teamId, teamId),
        or(
          eq(subscriptions.status, 'active'),
          eq(subscriptions.status, 'cancelled'),
          eq(subscriptions.status, 'past_due')
        )
      )
    )
    .orderBy(subscriptions.createdAt)
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get payment history for a team's subscriptions.
 */
export async function getPaymentHistory(teamId: string) {
  return db
    .select()
    .from(subscriptionPayments)
    .where(eq(subscriptionPayments.teamId, teamId))
    .orderBy(subscriptionPayments.createdAt);
}

/**
 * Create a new subscription + pending payment record.
 * Returns both the subscription and payment.
 */
export async function createSubscription(
  teamId: string,
  planId: string,
  billingCycle: 'monthly' | 'yearly',
  amount: number
) {
  const now = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // Create subscription in pending state
  const [subscription] = await db
    .insert(subscriptions)
    .values({
      teamId,
      planId,
      status: 'past_due', // Will become 'active' after payment
      billingCycle,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    })
    .returning();

  // Create pending payment
  const [payment] = await db
    .insert(subscriptionPayments)
    .values({
      subscriptionId: subscription.id,
      teamId,
      amount: amount.toFixed(2),
      currency: 'BTN',
      status: 'pending',
      paymentMethod: 'rma_gateway',
    })
    .returning();

  return { subscription, payment };
}

/**
 * Activate a subscription after successful payment.
 * Updates subscription status and team's planId.
 */
export async function activateSubscription(subscriptionId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);

  if (!sub) throw new Error('Subscription not found');

  // Mark subscription as active
  await db
    .update(subscriptions)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));

  // Update team's planId
  await db
    .update(teams)
    .set({ planId: sub.planId, updatedAt: new Date() })
    .where(eq(teams.id, sub.teamId));

  // Mark any previous active subscriptions as expired
  await db
    .update(subscriptions)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(
      and(
        eq(subscriptions.teamId, sub.teamId),
        eq(subscriptions.status, 'active'),
        // Don't expire the one we just activated
      )
    );
  // Re-activate the current one (in case above caught it)
  await db
    .update(subscriptions)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId));

  return sub;
}

/**
 * Mark payment as completed.
 */
export async function completePayment(
  paymentId: string,
  transactionId: string,
  gatewayResponse?: Record<string, any>
) {
  await db
    .update(subscriptionPayments)
    .set({
      status: 'completed',
      transactionId,
      gatewayResponse,
      paidAt: new Date(),
    })
    .where(eq(subscriptionPayments.id, paymentId));
}

/**
 * Cancel a subscription. It stays active until the current period ends.
 */
export async function cancelSubscription(subscriptionId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);

  if (!sub) throw new Error('Subscription not found');

  await db
    .update(subscriptions)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));

  return sub;
}

/**
 * Check for expired subscriptions and downgrade to free plan.
 * Intended to be called by a cron job.
 */
export async function checkSubscriptionExpiry() {
  const now = new Date();

  // Find expired subscriptions (cancelled or active past their period end)
  const expired = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        or(
          eq(subscriptions.status, 'active'),
          eq(subscriptions.status, 'cancelled')
        ),
        lte(subscriptions.currentPeriodEnd, now)
      )
    );

  // Get free plan
  const [freePlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.isDefault, true))
    .limit(1);

  if (!freePlan) {
    console.error('[Subscription Expiry] No default (free) plan found');
    return { processed: 0 };
  }

  let processed = 0;
  for (const sub of expired) {
    // Mark subscription as expired
    await db
      .update(subscriptions)
      .set({ status: 'expired', updatedAt: now })
      .where(eq(subscriptions.id, sub.id));

    // Downgrade team to free plan
    await db
      .update(teams)
      .set({ planId: freePlan.id, updatedAt: now })
      .where(eq(teams.id, sub.teamId));

    processed++;
  }

  return { processed };
}
