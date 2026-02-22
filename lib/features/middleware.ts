'use server';

import { NextRequest, NextResponse } from 'next/server';
import { hasFeature, getTeamFeatures } from './index';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Wraps an API route handler to enforce a feature flag.
 * Returns 403 if the feature is not enabled for the current team.
 */
export function withFeature(
  featureCode: string,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]) => {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 403 });
    }

    const features = await getTeamFeatures(team.id);
    if (!features.has(featureCode)) {
      return NextResponse.json(
        { error: `This feature (${featureCode}) is not available on your current plan.` },
        { status: 403 }
      );
    }

    return handler(request, ...args);
  };
}

/**
 * For use in server actions — throws an error if the feature is not enabled.
 */
export async function requireFeature(featureCode: string): Promise<void> {
  const enabled = await hasFeature(featureCode);
  if (!enabled) {
    throw new Error(
      `This feature (${featureCode}) is not available on your current plan. Please upgrade to access it.`
    );
  }
}
