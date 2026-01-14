'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/session';
import { validatedAction } from '@/lib/auth/middleware';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPassword = validatedAction(resetPasswordSchema, async (data) => {
  const { token, password } = data;

  // Find user with this reset token
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);

  if (!user) {
    return {
      error: 'Invalid or expired reset link. Please request a new password reset.',
    };
  }

  // Check if token expired
  if (user.passwordResetTokenExpiry && new Date() > user.passwordResetTokenExpiry) {
    return {
      error: 'This reset link has expired. Please request a new password reset.',
    };
  }

  // Hash the new password
  const passwordHash = await hashPassword(password);

  // Update user password and clear reset token
  await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return { success: 'Password reset successfully' };
});
