import { z } from 'zod';

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'member'], {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

export const updateMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member']),
});

export const removeMemberSchema = z.object({
  memberId: z.string().uuid(),
});

export const cancelInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});

export type InviteUserData = z.infer<typeof inviteUserSchema>;
export type UpdateMemberRoleData = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberData = z.infer<typeof removeMemberSchema>;
export type CancelInvitationData = z.infer<typeof cancelInvitationSchema>;
