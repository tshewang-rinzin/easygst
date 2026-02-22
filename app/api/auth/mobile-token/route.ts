import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { comparePasswords } from '@/lib/auth/session';
import { signMobileToken } from '@/lib/auth/mobile-auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceName: z.string().optional(),
  deviceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const valid = await comparePasswords(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Get team
    const membership = await db
      .select({ role: teamMembers.role, team: teams })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (!membership[0]) {
      return NextResponse.json({ error: 'No team found for user' }, { status: 403 });
    }

    const { team } = membership[0];

    // Generate token
    const token = await signMobileToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      team: { id: team.id, name: team.name, businessName: team.businessName },
    });
  } catch (error) {
    console.error('[mobile-token] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
