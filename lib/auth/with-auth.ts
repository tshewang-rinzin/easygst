import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser, getUserTeamRole } from '@/lib/db/queries';
import { User, TeamDataWithMembers } from '@/lib/db/schema';

interface AuthContext {
  user: User;
  team: TeamDataWithMembers;
  role: string;
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext & { params?: any }
) => Promise<NextResponse>;

/**
 * Wraps an API route handler to enforce authentication and team scoping.
 * Returns 401 if not authenticated, 403 if no team found.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, routeContext?: { params?: Promise<any> }) => {
    try {
      const user = await getUser();
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const team = await getTeamForUser();
      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 403 }
        );
      }

      const role = await getUserTeamRole() || 'member';
      const params = routeContext?.params ? await routeContext.params : undefined;

      return handler(request, { user, team, role, params });
    } catch (error) {
      console.error('[withAuth] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wraps an API route handler with role-based access control.
 * Use for admin/owner-only endpoints.
 */
export function withRole(requiredRole: 'member' | 'admin' | 'owner', handler: AuthenticatedHandler) {
  const hierarchy: Record<string, number> = { member: 1, admin: 2, owner: 3 };

  return withAuth(async (request, context) => {
    const userLevel = hierarchy[context.role] || 0;
    const requiredLevel = hierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return NextResponse.json(
        { error: `This action requires ${requiredRole} or higher role` },
        { status: 403 }
      );
    }

    return handler(request, context);
  });
}
