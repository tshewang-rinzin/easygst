'use server';

import { db } from '@/lib/db/drizzle';
import { plans, features, planFeatures, teamFeatureOverrides, teams } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all enabled feature codes for a team.
 * Resolves: plan features + team overrides.
 */
export async function getTeamFeatures(teamId?: string): Promise<Set<string>> {
  let tid = teamId;
  if (!tid) {
    const team = await getTeamForUser();
    if (!team) return new Set();
    tid = team.id;
  }

  // Get team's plan
  const [teamRow] = await db.select({ planId: teams.planId }).from(teams).where(eq(teams.id, tid)).limit(1);
  
  // Get plan features
  let planFeatureCodes: string[] = [];
  if (teamRow?.planId) {
    const pf = await db
      .select({ code: features.code })
      .from(planFeatures)
      .innerJoin(features, eq(planFeatures.featureId, features.id))
      .where(and(eq(planFeatures.planId, teamRow.planId), eq(features.isActive, true)));
    planFeatureCodes = pf.map(f => f.code);
  } else {
    // No plan assigned — get default plan features
    const [defaultPlan] = await db.select().from(plans).where(eq(plans.isDefault, true)).limit(1);
    if (defaultPlan) {
      const pf = await db
        .select({ code: features.code })
        .from(planFeatures)
        .innerJoin(features, eq(planFeatures.featureId, features.id))
        .where(and(eq(planFeatures.planId, defaultPlan.id), eq(features.isActive, true)));
      planFeatureCodes = pf.map(f => f.code);
    }
  }

  // Get team overrides
  const overrides = await db
    .select({ featureCode: teamFeatureOverrides.featureCode, enabled: teamFeatureOverrides.enabled })
    .from(teamFeatureOverrides)
    .where(eq(teamFeatureOverrides.teamId, tid));

  // Build final feature set
  const featureSet = new Set(planFeatureCodes);
  for (const o of overrides) {
    if (o.enabled) {
      featureSet.add(o.featureCode);
    } else {
      featureSet.delete(o.featureCode);
    }
  }

  return featureSet;
}

/**
 * Check if a feature is enabled for the current team.
 */
export async function hasFeature(featureCode: string): Promise<boolean> {
  const featureSet = await getTeamFeatures();
  return featureSet.has(featureCode);
}

/**
 * Get all available features (for admin).
 */
export async function getAllFeatures() {
  return db.select().from(features).where(eq(features.isActive, true)).orderBy(features.module, features.sortOrder);
}

/**
 * Get all plans with their features (for admin).
 */
export async function getAllPlans() {
  return db.query.plans.findMany({
    where: eq(plans.isActive, true),
    orderBy: plans.sortOrder,
    with: {
      planFeatures: {
        with: {
          feature: true,
        },
      },
    },
  });
}

/**
 * Get plan for a specific team.
 */
export async function getTeamPlan(teamId: string) {
  const [team] = await db.select({ planId: teams.planId }).from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team?.planId) return null;
  return db.query.plans.findFirst({ where: eq(plans.id, team.planId) });
}

/**
 * Get team feature overrides.
 */
export async function getTeamOverrides(teamId: string) {
  return db.select().from(teamFeatureOverrides).where(eq(teamFeatureOverrides.teamId, teamId));
}
