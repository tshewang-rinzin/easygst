'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { teamMembers, invitations, activityLogs, ActivityType, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import {
  inviteUserSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  cancelInvitationSchema,
} from './validation';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email/utils';
import TeamInvitationEmail from '@/lib/email/templates/team-invitation-email';

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

      // Check if email is already invited
      const existingInvitation = await db.query.invitations.findFirst({
        where: and(
          eq(invitations.teamId, team.id),
          eq(invitations.email, data.email),
          eq(invitations.status, 'pending')
        ),
      });

      if (existingInvitation) {
        return { success: false, message: 'User already has a pending invitation' };
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, data.email),
      });

      if (existingUser) {
        // Check if already a team member
        const existingMember = await db.query.teamMembers.findFirst({
          where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, existingUser.id)),
        });

        if (existingMember) {
          return { success: false, message: 'User is already a team member' };
        }

        // Auto-add existing user to team
        await db.insert(teamMembers).values({
          teamId: team.id,
          userId: existingUser.id,
          role: data.role,
        });

        // Log activity
        await db.insert(activityLogs).values({
          teamId: team.id,
          userId: user.id,
          action: `${ActivityType.INVITE_USER}: ${data.email} (auto-added existing user)`,
          timestamp: new Date(),
        });

        // Send welcome email (optional - could create a welcome template)
        try {
          const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          await sendEmail({
            to: data.email,
            subject: `You've been added to ${team.name} on EasyGST`,
            template: TeamInvitationEmail({
              invitedByName: user.name || undefined,
              invitedByEmail: user.email,
              teamName: team.name,
              role: data.role,
              invitationUrl: `${baseUrl}/sign-in`,
              expiryDays: 7,
            }),
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Continue anyway - user is already added
        }

        revalidatePath('/settings/users');
        return { success: true, message: 'User added to team successfully', autoAdded: true };
      }

      // Generate invitation token
      const invitationToken = randomBytes(32).toString('hex');
      const invitationTokenExpiry = new Date();
      invitationTokenExpiry.setDate(invitationTokenExpiry.getDate() + 7); // 7 days

      // Create invitation
      await db.insert(invitations).values({
        teamId: team.id,
        email: data.email,
        role: data.role,
        invitedBy: user.id,
        invitationToken,
        invitationTokenExpiry,
        lastEmailSentAt: new Date(),
        emailSentCount: 1,
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.INVITE_USER}: ${data.email}`,
        timestamp: new Date(),
      });

      // Send invitation email
      let emailFailed = false;
      try {
        const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const invitationUrl = `${baseUrl}/sign-up?token=${invitationToken}`;

        await sendEmail({
          to: data.email,
          subject: `You've been invited to join ${team.name} on EasyGST`,
          template: TeamInvitationEmail({
            invitedByName: user.name || undefined,
            invitedByEmail: user.email,
            teamName: team.name,
            role: data.role,
            invitationUrl,
            expiryDays: 7,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        emailFailed = true;
      }

      revalidatePath('/settings/users');

      if (emailFailed) {
        return {
          success: true,
          message: 'Invitation created but email failed to send. Please resend.',
          emailFailed: true,
        };
      }

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

/**
 * Resend an invitation email
 */
export const resendInvitation = validatedActionWithUser(
  cancelInvitationSchema, // Reuse same schema (invitationId)
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { success: false, message: 'Team not found' };
      }

      // Get invitation
      const invitation = await db.query.invitations.findFirst({
        where: and(
          eq(invitations.id, data.invitationId),
          eq(invitations.teamId, team.id),
          eq(invitations.status, 'pending')
        ),
      });

      if (!invitation) {
        return { success: false, message: 'Invitation not found or already accepted' };
      }

      // Check rate limiting
      const emailSentCount = invitation.emailSentCount || 1;
      if (emailSentCount >= 5) {
        return {
          success: false,
          message: 'Maximum resend limit reached. Please cancel and create a new invitation.',
        };
      }

      // Check cooldown (5 minutes)
      if (invitation.lastEmailSentAt) {
        const timeSinceLastSend = Date.now() - invitation.lastEmailSentAt.getTime();
        const fiveMinutes = 5 * 60 * 1000;
        if (timeSinceLastSend < fiveMinutes) {
          const minutesRemaining = Math.ceil((fiveMinutes - timeSinceLastSend) / 60000);
          return {
            success: false,
            message: `Please wait ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} before resending.`,
          };
        }
      }

      // Generate new token and extend expiry
      const invitationToken = randomBytes(32).toString('hex');
      const invitationTokenExpiry = new Date();
      invitationTokenExpiry.setDate(invitationTokenExpiry.getDate() + 7); // 7 days from now

      // Update invitation
      await db
        .update(invitations)
        .set({
          invitationToken,
          invitationTokenExpiry,
          lastEmailSentAt: new Date(),
          emailSentCount: emailSentCount + 1,
        })
        .where(eq(invitations.id, data.invitationId));

      // Send invitation email
      try {
        const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const invitationUrl = `${baseUrl}/sign-up?token=${invitationToken}`;

        await sendEmail({
          to: invitation.email,
          subject: `Reminder: You've been invited to join ${team.name} on EasyGST`,
          template: TeamInvitationEmail({
            invitedByName: user.name || undefined,
            invitedByEmail: user.email,
            teamName: team.name,
            role: invitation.role,
            invitationUrl,
            expiryDays: 7,
          }),
        });
      } catch (emailError) {
        console.error('Failed to resend invitation email:', emailError);
        return {
          success: false,
          message: 'Failed to send email. Please try again.',
        };
      }

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.INVITE_USER}: Resent invitation to ${invitation.email}`,
        timestamp: new Date(),
      });

      revalidatePath('/settings/users');

      return {
        success: true,
        message: `Invitation resent successfully (${emailSentCount + 1}/${5})`,
      };
    } catch (error) {
      console.error('Error resending invitation:', error);
      return { success: false, message: 'Failed to resend invitation' };
    }
  }
);

/**
 * Get invitation details by token (for pre-filling signup form)
 */
export const getInvitationByToken = async (token: string) => {
  try {
    if (!token) {
      return { success: false, error: 'Invalid invitation link' };
    }

    const invitation = await db.query.invitations.findFirst({
      where: and(eq(invitations.invitationToken, token), eq(invitations.status, 'pending')),
      with: {
        team: true,
        invitedByUser: true,
      },
    });

    if (!invitation) {
      return { success: false, error: 'Invalid or expired invitation link' };
    }

    // Check if expired
    if (invitation.invitationTokenExpiry && invitation.invitationTokenExpiry < new Date()) {
      return { success: false, error: 'This invitation has expired. Please ask for a new invitation.' };
    }

    return {
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        teamName: invitation.team.name,
        invitedBy: invitation.invitedByUser.name || invitation.invitedByUser.email,
      },
    };
  } catch (error) {
    console.error('Error getting invitation by token:', error);
    return { success: false, error: 'Failed to validate invitation' };
  }
};
