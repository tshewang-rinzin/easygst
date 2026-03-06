import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/auth/with-auth';

export const POST = withAuth(async (request: NextRequest, { team }) => {
  try {
    await db
      .update(teams)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(teams.id, team.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
});
