import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { verifyMobileToken } from '@/lib/auth/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 401 });
    }

    const payload = await verifyMobileToken(auth.slice(7));
    if (!payload) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, payload.userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return NextResponse.json({ valid: false, error: 'User not found' }, { status: 401 });
    }

    const membership = await db
      .select({ team: teams })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (!membership[0]) {
      return NextResponse.json({ valid: false, error: 'Team not found' }, { status: 403 });
    }

    const { team } = membership[0];

    return NextResponse.json({
      valid: true,
      user: { id: user.id, name: user.name, email: user.email },
      team: { id: team.id, name: team.name, businessName: team.businessName },
    });
  } catch (error) {
    console.error('[mobile-verify] Error:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
