'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { validatedAction } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/utils';
import PasswordResetEmail from '@/lib/email/templates/password-reset-email';
import { randomBytes } from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const requestPasswordReset = validatedAction(forgotPasswordSchema, async (data) => {
  const { email } = data;

  // Find the user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  // Always return success message to prevent email enumeration
  const successMessage = 'If an account exists with this email, you will receive a password reset link shortly.';

  if (!user) {
    // Don't reveal that the user doesn't exist
    return { success: successMessage };
  }

  // Generate password reset token
  const resetToken = randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

  // Update user with reset token
  await db
    .update(users)
    .set({
      passwordResetToken: resetToken,
      passwordResetTokenExpiry: resetTokenExpiry,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Send reset email
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset your password - EasyGST',
      template: PasswordResetEmail({
        name: user.name || undefined,
        resetUrl,
        expiryHours: 1,
      }),
    });

    return { success: successMessage };
  } catch (error) {
    console.error('[ForgotPassword] Failed to send password reset email:', error);
    // Still return success to prevent email enumeration
    return { success: successMessage };
  }
});
