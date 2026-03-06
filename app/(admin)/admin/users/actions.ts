'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { validatedActionWithPlatformAdmin } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/utils';
import PasswordResetEmail from '@/lib/email/templates/password-reset-email';
import VerifyEmail from '@/lib/email/templates/verify-email';
import { hashToken } from '@/lib/auth/crypto';
import { randomBytes } from 'crypto';

const sendPasswordResetSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const sendPasswordResetEmail = validatedActionWithPlatformAdmin(
  sendPasswordResetSchema,
  async (data) => {
    const { userId } = data;

    // Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { error: 'User not found' };
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
      .where(eq(users.id, userId));

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

      return { success: `Password reset email sent to ${user.email}` };
    } catch (error) {
      console.error('[Admin] Failed to send password reset email:', error);
      return { error: 'Failed to send email. Please try again.' };
    }
  }
);

const resendVerificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const adminResendVerificationEmail = validatedActionWithPlatformAdmin(
  resendVerificationSchema,
  async (data) => {
    const { userId } = data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { error: 'User not found' };
    }

    if (user.emailVerified) {
      return { error: 'Email is already verified' };
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    await db
      .update(users)
      .set({
        verificationToken: hashToken(verificationToken),
        verificationTokenExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email address - EasyGST',
        template: VerifyEmail({
          name: user.name || undefined,
          verificationUrl,
          expiryHours: 24,
        }),
      });

      return { success: `Verification email sent to ${user.email}` };
    } catch (error) {
      console.error('[Admin] Failed to send verification email:', error);
      return { error: 'Failed to send email. Please try again.' };
    }
  }
);
