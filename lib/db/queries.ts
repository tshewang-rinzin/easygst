import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, platformAdmins } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'string'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getUserWithTeam(userId: string) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}

/**
 * Get the current user's role in their team
 */
export async function getUserTeamRole(): Promise<string | null> {
  const user = await getUser();
  if (!user) return null;

  const membership = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  return membership[0]?.role || null;
}

/**
 * Check if the current user has a specific role (or higher)
 * Role hierarchy: owner > admin > member
 */
export async function hasRole(requiredRole: 'member' | 'admin' | 'owner'): Promise<boolean> {
  const role = await getUserTeamRole();
  if (!role) return false;

  const hierarchy: Record<string, number> = { member: 1, admin: 2, owner: 3 };
  return (hierarchy[role] || 0) >= (hierarchy[requiredRole] || 0);
}

/**
 * Get platform admin from admin session cookie
 */
export async function getPlatformAdmin() {
  const sessionCookie = (await cookies()).get('admin_session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.admin ||
    typeof sessionData.admin.id !== 'string'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const admin = await db
    .select()
    .from(platformAdmins)
    .where(eq(platformAdmins.id, sessionData.admin.id))
    .limit(1);

  if (admin.length === 0) {
    return null;
  }

  return admin[0];
}
