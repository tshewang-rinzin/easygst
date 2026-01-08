'use server';

import { db } from '@/lib/db/drizzle';
import { paymentMethods } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all payment methods for the current user's team
 */
export async function getPaymentMethods() {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const methods = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.teamId, team.id))
    .orderBy(paymentMethods.sortOrder, paymentMethods.id);

  return methods;
}

/**
 * Get only enabled payment methods (for dropdowns)
 */
export async function getEnabledPaymentMethods() {
  const team = await getTeamForUser();
  if (!team) {
    return [];
  }

  const methods = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.teamId, team.id),
        eq(paymentMethods.isEnabled, true)
      )
    )
    .orderBy(paymentMethods.sortOrder, paymentMethods.id);

  return methods;
}

/**
 * Get a single payment method by ID
 */
export async function getPaymentMethodById(methodId: number) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const [method] = await db
    .select()
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.id, methodId),
        eq(paymentMethods.teamId, team.id)
      )
    )
    .limit(1);

  return method || null;
}

/**
 * Check if team has any payment methods
 */
export async function hasPaymentMethods() {
  const team = await getTeamForUser();
  if (!team) {
    return false;
  }

  const methods = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(eq(paymentMethods.teamId, team.id))
    .limit(1);

  return methods.length > 0;
}
