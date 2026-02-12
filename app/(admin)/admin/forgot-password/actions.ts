'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { platformAdmins } from '@/lib/db/schema';
import { validatedAction } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/utils';
import PasswordResetEmail from '@/lib/email/templates/password-reset-email';
import { randomBytes } from 'crypto';
import { hashToken } from '@/lib/auth/crypto';
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/auth/rate-limit';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const requestAdminPasswordReset = validatedAction(forgotPasswordSchema, async (data) => {
  const { email } = data;

  // Rate limit by email
  const rl = checkRateLimit(
    getRateLimitKey('admin-forgot-password', email.toLowerCase()),
    RATE_LIMITS.forgotPassword
  );
  if (!rl.allowed) {
    return {
      error: `Too many requests. Please try again in ${rl.retryAfterSeconds} seconds.`,
    };
  }

  // Find the admin by email
  const [admin] = await db
    .select()
    .from(platformAdmins)
    .where(eq(platformAdmins.email, email.toLowerCase()))
    .limit(1);

  // Always return success message to prevent email enumeration
  const successMessage = 'If an admin account exists with this email, you will receive a password reset link shortly.';

  if (!admin) {
    return { success: successMessage };
  }

  if (!admin.isActive) {
    return { success: successMessage };
  }

  // Generate password reset token
  const resetToken = randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

  // Store hashed token in DB
  await db
    .update(platformAdmins)
    .set({
      passwordResetToken: hashToken(resetToken),
      passwordResetTokenExpiry: resetTokenExpiry,
      updatedAt: new Date(),
    })
    .where(eq(platformAdmins.id, admin.id));

  // Send reset email with plaintext token in URL
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`;

  try {
    await sendEmail({
      to: admin.email,
      subject: 'Reset your admin password - EasyGST',
      template: PasswordResetEmail({
        name: admin.name || undefined,
        resetUrl,
        expiryHours: 1,
      }),
    });

    return { success: successMessage };
  } catch (error) {
    console.error('[AdminForgotPassword] Failed to send password reset email:', error);
    return { success: successMessage };
  }
});
