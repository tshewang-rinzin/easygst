import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { plans, features, planFeatures, teams } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getPlatformAdmin } from '@/lib/db/queries';

export async function GET() {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allPlans = await db.query.plans.findMany({
    orderBy: plans.sortOrder,
    with: {
      planFeatures: { with: { feature: true } },
    },
  });

  // Get team counts per plan
  const planTeamCounts = await db
    .select({ planId: teams.planId, count: count() })
    .from(teams)
    .groupBy(teams.planId);

  const countsMap = Object.fromEntries(planTeamCounts.map(p => [p.planId, p.count]));

  const result = allPlans.map(p => ({
    ...p,
    teamCount: countsMap[p.id] || 0,
    features: p.planFeatures.map(pf => pf.feature),
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, description, isDefault, maxUsers, maxInvoicesPerMonth, maxProducts, maxCustomers, monthlyPrice, yearlyPrice, sortOrder, featureIds } = body;

  if (!name) return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });

  // If setting as default, unset other defaults
  if (isDefault) {
    await db.update(plans).set({ isDefault: false }).where(eq(plans.isDefault, true));
  }

  const [plan] = await db.insert(plans).values({
    name,
    description: description || null,
    isDefault: isDefault || false,
    maxUsers: maxUsers || null,
    maxInvoicesPerMonth: maxInvoicesPerMonth || null,
    maxProducts: maxProducts || null,
    maxCustomers: maxCustomers || null,
    monthlyPrice: monthlyPrice?.toString() || '0',
    yearlyPrice: yearlyPrice?.toString() || '0',
    sortOrder: sortOrder || 0,
  }).returning();

  // Assign features
  if (featureIds?.length) {
    await db.insert(planFeatures).values(
      featureIds.map((fId: string) => ({ planId: plan.id, featureId: fId }))
    );
  }

  return NextResponse.json(plan);
}
