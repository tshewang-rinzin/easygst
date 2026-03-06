import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { bankAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/auth/with-auth';
import { getSetupProgress } from '@/lib/onboarding/setup-progress';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  try {
    const accounts = await db
      .select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(eq(bankAccounts.teamId, team.id));

    const progress = getSetupProgress(team, accounts.length);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching setup progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setup progress' },
      { status: 500 }
    );
  }
});
