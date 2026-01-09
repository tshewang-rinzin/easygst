import { z } from 'zod';

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'member'], {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

export const updateMemberRoleSchema = z.object({
  memberId: z.number().int().positive(),
  role: z.enum(['owner', 'admin', 'member']),
});

export const removeMemberSchema = z.object({
  memberId: z.number().int().positive(),
});

export const cancelInvitationSchema = z.object({
  invitationId: z.number().int().positive(),
});

export type InviteUserData = z.infer<typeof inviteUserSchema>;
export type UpdateMemberRoleData = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberData = z.infer<typeof removeMemberSchema>;
export type CancelInvitationData = z.infer<typeof cancelInvitationSchema>;
