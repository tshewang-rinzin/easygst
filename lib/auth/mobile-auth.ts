import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

export interface MobileTokenPayload {
  userId: string;
  email: string;
  exp?: number;
}

export interface MobileAuthContext {
  user: { id: string; name: string | null; email: string };
  team: { id: string; name: string; businessName: string | null; defaultCurrency: string; invoicePrefix: string | null; defaultGstRate: string };
  role: string;
}

/**
 * Sign a mobile JWT token (30 days expiry)
 */
export async function signMobileToken(payload: { userId: string; email: string }): Promise<string> {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

/**
 * Verify a mobile JWT token and return the payload
 */
export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload as unknown as MobileTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extract bearer token from Authorization header
 */
function extractBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

/**
 * Resolve user and team from a userId
 */
async function resolveUserAndTeam(userId: string): Promise<MobileAuthContext | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!user) return null;

  const membership = await db
    .select({
      role: teamMembers.role,
      team: teams,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId))
    .limit(1);

  if (!membership[0]) return null;

  const { team, role } = membership[0];

  return {
    user: { id: user.id, name: user.name, email: user.email },
    team: {
      id: team.id,
      name: team.name,
      businessName: team.businessName,
      defaultCurrency: team.defaultCurrency,
      invoicePrefix: team.invoicePrefix,
      defaultGstRate: team.defaultGstRate,
    },
    role,
  };
}

type MobileAuthHandler = (
  request: NextRequest,
  context: MobileAuthContext & { params?: any }
) => Promise<NextResponse>;

/**
 * Wraps an API route handler to enforce mobile JWT authentication.
 */
export function withMobileAuth(handler: MobileAuthHandler) {
  return async (request: NextRequest, routeContext?: { params?: Promise<any> }) => {
    try {
      const token = extractBearerToken(request);
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const payload = await verifyMobileToken(token);
      if (!payload) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }

      const authContext = await resolveUserAndTeam(payload.userId);
      if (!authContext) {
        return NextResponse.json({ error: 'User or team not found' }, { status: 401 });
      }

      const params = routeContext?.params ? await routeContext.params : undefined;
      return handler(request, { ...authContext, params });
    } catch (error) {
      console.error('[withMobileAuth] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
