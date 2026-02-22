'use server';

import { db } from '@/lib/db/drizzle';
import { plans, teams, invoices, products, customers } from '@/lib/db/schema';
import { eq, and, count, gte } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

interface UsageLimitResult {
  allowed: boolean;
  current: number;
  limit: number | null;
}

/**
 * Check usage limits based on the team's current plan.
 */
export async function checkUsageLimit(
  limitType: 'invoices' | 'products' | 'customers',
  teamId?: string
): Promise<UsageLimitResult> {
  let tid = teamId;
  if (!tid) {
    const team = await getTeamForUser();
    if (!team) return { allowed: true, current: 0, limit: null };
    tid = team.id;
  }

  // Get team's plan
  const [teamRow] = await db
    .select({ planId: teams.planId })
    .from(teams)
    .where(eq(teams.id, tid))
    .limit(1);

  if (!teamRow?.planId) {
    // No plan = no limits
    return { allowed: true, current: 0, limit: null };
  }

  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, teamRow.planId))
    .limit(1);

  if (!plan) return { allowed: true, current: 0, limit: null };

  let currentCount = 0;
  let maxLimit: number | null = null;

  switch (limitType) {
    case 'invoices': {
      maxLimit = plan.maxInvoicesPerMonth;
      if (maxLimit === null) return { allowed: true, current: 0, limit: null };
      // Count invoices created this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const [result] = await db
        .select({ count: count() })
        .from(invoices)
        .where(and(eq(invoices.teamId, tid), gte(invoices.createdAt, startOfMonth)));
      currentCount = result.count;
      break;
    }
    case 'products': {
      maxLimit = plan.maxProducts;
      if (maxLimit === null) return { allowed: true, current: 0, limit: null };
      const [result] = await db
        .select({ count: count() })
        .from(products)
        .where(eq(products.teamId, tid));
      currentCount = result.count;
      break;
    }
    case 'customers': {
      maxLimit = plan.maxCustomers;
      if (maxLimit === null) return { allowed: true, current: 0, limit: null };
      const [result] = await db
        .select({ count: count() })
        .from(customers)
        .where(eq(customers.teamId, tid));
      currentCount = result.count;
      break;
    }
  }

  return {
    allowed: maxLimit === null || currentCount < maxLimit,
    current: currentCount,
    limit: maxLimit,
  };
}
