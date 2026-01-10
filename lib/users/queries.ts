import { db } from '@/lib/db/drizzle';
import { users, teamMembers, invitations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

export interface TeamMemberWithUser {
  id: string;
  userId: string;
  role: string;
  joinedAt: Date;
  name: string | null;
  email: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  invitedAt: Date;
  invitedByName: string | null;
  invitedByEmail: string;
  emailSentCount: number;
  lastEmailSentAt: Date | null;
  invitationTokenExpiry: Date | null;
  status: string;
}

/**
 * Get all team members with user details
 */
export async function getTeamMembers(): Promise<TeamMemberWithUser[]> {
  const team = await getTeamForUser();
  if (!team) return [];

  const members = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      name: users.name,
      email: users.email,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(and(eq(teamMembers.teamId, team.id)));

  return members;
}

/**
 * Get pending invitations for the team
 */
export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  const team = await getTeamForUser();
  if (!team) return [];

  const pending = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      invitedAt: invitations.invitedAt,
      invitedByName: users.name,
      invitedByEmail: users.email,
      emailSentCount: invitations.emailSentCount,
      lastEmailSentAt: invitations.lastEmailSentAt,
      invitationTokenExpiry: invitations.invitationTokenExpiry,
      status: invitations.status,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.invitedBy, users.id))
    .where(and(eq(invitations.teamId, team.id), eq(invitations.status, 'pending')));

  return pending;
}

/**
 * Get team member by user ID
 */
export async function getTeamMemberByUserId(userId: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const member = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, userId)),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return member;
}
