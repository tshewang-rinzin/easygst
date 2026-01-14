'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { platformAdmins } from '@/lib/db/schema';
import { comparePasswords, setAdminSession, clearAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { validatedAction } from '@/lib/auth/middleware';

const adminSignInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const adminSignIn = validatedAction(adminSignInSchema, async (data) => {
  const { email, password } = data;

  // Find admin by email
  const [admin] = await db
    .select()
    .from(platformAdmins)
    .where(eq(platformAdmins.email, email))
    .limit(1);

  if (!admin) {
    return {
      error: 'Invalid email or password.',
    };
  }

  // Check if admin is active
  if (!admin.isActive) {
    return {
      error: 'Your account has been deactivated. Please contact support.',
    };
  }

  // Verify password
  const isPasswordValid = await comparePasswords(password, admin.passwordHash);
  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password.',
    };
  }

  // Update last login time
  await db
    .update(platformAdmins)
    .set({ lastLoginAt: new Date() })
    .where(eq(platformAdmins.id, admin.id));

  // Set admin session
  await setAdminSession(admin);

  redirect('/admin');
});

export async function adminSignOut() {
  await clearAdminSession();
  redirect('/admin/login');
}
