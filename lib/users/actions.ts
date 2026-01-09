'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { teamMembers, invitations, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import {
  inviteUserSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  cancelInvitationSchema,
} from './validation';

/**
 * Invite a new user to the team
 */
export const inviteUser = validatedActionWithUser(
  inviteUserSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { success: false, message: 'Team not found' };
      }

      // Check if email is already invited or is a member
      const existingInvitation = await db.query.invitations.findFirst({
        where: and(eq(invitations.teamId, team.id), eq(invitations.email, data.email)),
      });

      if (existingInvitation) {
        return { success: false, message: 'User already invited' };
      }

      // Check if user is already a member
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, data.email),
      });

      if (existingUser) {
        const existingMember = await db.query.teamMembers.findFirst({
          where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, existingUser.id)),
        });

        if (existingMember) {
          return { success: false, message: 'User is already a team member' };
        }
      }

      // Create invitation
      await db.insert(invitations).values({
        teamId: team.id,
        email: data.email,
        role: data.role,
        invitedBy: user.id,
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.INVITE_USER}: ${data.email}`,
        timestamp: new Date(),
      });

      revalidatePath('/settings/users');

      return { success: true, message: 'Invitation sent successfully' };
    } catch (error) {
      console.error('Error inviting user:', error);
      return { success: false, message: 'Failed to send invitation' };
    }
  }
);

/**
 * Update a team member's role
 */
export const updateMemberRole = validatedActionWithUser(
  updateMemberRoleSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { success: false, message: 'Team not found' };
      }

      // Check if member exists and belongs to this team
      const member = await db.query.teamMembers.findFirst({
        where: and(eq(teamMembers.id, data.memberId), eq(teamMembers.teamId, team.id)),
      });

      if (!member) {
        return { success: false, message: 'Member not found' };
      }

      // Prevent user from changing their own role
      if (member.userId === user.id) {
        return { success: false, message: 'Cannot change your own role' };
      }

      // Update role
      await db
        .update(teamMembers)
        .set({ role: data.role })
        .where(eq(teamMembers.id, data.memberId));

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.UPDATE_ACCOUNT}: Changed member role to ${data.role}`,
        timestamp: new Date(),
      });

      revalidatePath('/settings/users');

      return { success: true, message: 'Role updated successfully' };
    } catch (error) {
      console.error('Error updating member role:', error);
      return { success: false, message: 'Failed to update role' };
    }
  }
);

/**
 * Remove a team member
 */
export const removeMember = validatedActionWithUser(
  removeMemberSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { success: false, message: 'Team not found' };
      }

      // Check if member exists and belongs to this team
      const member = await db.query.teamMembers.findFirst({
        where: and(eq(teamMembers.id, data.memberId), eq(teamMembers.teamId, team.id)),
      });

      if (!member) {
        return { success: false, message: 'Member not found' };
      }

      // Prevent user from removing themselves
      if (member.userId === user.id) {
        return { success: false, message: 'Cannot remove yourself from the team' };
      }

      // Count remaining owners
      const owners = await db.query.teamMembers.findMany({
        where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.role, 'owner')),
      });

      // Prevent removing the last owner
      if (member.role === 'owner' && owners.length <= 1) {
        return { success: false, message: 'Cannot remove the last owner' };
      }

      // Remove member
      await db.delete(teamMembers).where(eq(teamMembers.id, data.memberId));

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.REMOVE_TEAM_MEMBER}: Removed member`,
        timestamp: new Date(),
      });

      revalidatePath('/settings/users');

      return { success: true, message: 'Member removed successfully' };
    } catch (error) {
      console.error('Error removing member:', error);
      return { success: false, message: 'Failed to remove member' };
    }
  }
);

/**
 * Cancel a pending invitation
 */
export const cancelInvitation = validatedActionWithUser(
  cancelInvitationSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { success: false, message: 'Team not found' };
      }

      // Check if invitation exists and belongs to this team
      const invitation = await db.query.invitations.findFirst({
        where: and(eq(invitations.id, data.invitationId), eq(invitations.teamId, team.id)),
      });

      if (!invitation) {
        return { success: false, message: 'Invitation not found' };
      }

      // Delete invitation
      await db.delete(invitations).where(eq(invitations.id, data.invitationId));

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.CANCEL_INVITATION}: ${invitation.email}`,
        timestamp: new Date(),
      });

      revalidatePath('/settings/users');

      return { success: true, message: 'Invitation cancelled successfully' };
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      return { success: false, message: 'Failed to cancel invitation' };
    }
  }
);
