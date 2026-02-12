'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { platformAdmins } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/session';
import { validatedAction } from '@/lib/auth/middleware';
import { hashToken } from '@/lib/auth/crypto';
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/auth/rate-limit';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetAdminPassword = validatedAction(resetPasswordSchema, async (data) => {
  const { token, password } = data;

  // Rate limit
  const rl = checkRateLimit(
    getRateLimitKey('admin-reset-password', token.substring(0, 8)),
    RATE_LIMITS.resetPassword
  );
  if (!rl.allowed) {
    return {
      error: `Too many attempts. Please try again in ${rl.retryAfterSeconds} seconds.`,
    };
  }

  // Hash the incoming token to compare with stored hash
  const tokenHash = hashToken(token);

  // Find admin with this reset token
  const [admin] = await db
    .select()
    .from(platformAdmins)
    .where(eq(platformAdmins.passwordResetToken, tokenHash))
    .limit(1);

  if (!admin) {
    return {
      error: 'Invalid or expired reset link. Please request a new password reset.',
    };
  }

  // Check if token expired
  if (admin.passwordResetTokenExpiry && new Date() > admin.passwordResetTokenExpiry) {
    return {
      error: 'This reset link has expired. Please request a new password reset.',
    };
  }

  // Check if admin is active
  if (!admin.isActive) {
    return {
      error: 'This account has been deactivated. Please contact support.',
    };
  }

  // Hash the new password
  const passwordHash = await hashPassword(password);

  // Update admin password and clear reset token
  await db
    .update(platformAdmins)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      updatedAt: new Date(),
    })
    .where(eq(platformAdmins.id, admin.id));

  return { success: 'Password reset successfully' };
});
