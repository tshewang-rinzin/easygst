'use server';

import { z } from 'zod';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { teams, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';

// Business Settings Validation Schema
const businessSettingsSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(255),
  tpn: z
    .string()
    .max(20, 'TPN is too long')
    .optional()
    .or(z.literal('')),
  gstNumber: z
    .string()
    .max(20, 'GST Number is too long')
    .optional()
    .or(z.literal('')),
  licenseNumber: z.string().max(50).optional(),
  address: z.string().max(1000).optional(),
  city: z.string().max(100).optional(),
  dzongkhag: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  defaultCurrency: z.enum(['BTN', 'INR', 'USD']),
  bankName: z.string().max(100).optional(),
  bankAccountNumber: z.string().max(50).optional(),
  bankAccountName: z.string().max(100).optional(),
  bankBranch: z.string().max(100).optional(),
  invoicePrefix: z.string().max(20).default('INV'),
  invoiceTerms: z.string().max(5000).optional(),
  invoiceFooter: z.string().max(1000).optional(),
  logoUrl: z.string().optional().or(z.literal('')),
});

export type BusinessSettingsFormData = z.infer<typeof businessSettingsSchema>;

/**
 * Update business settings for DRC compliance
 * Includes TPN, banking details, invoice configuration
 */
export const updateBusinessSettings = validatedActionWithUser(
  businessSettingsSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Update team with business settings
      await db
        .update(teams)
        .set({
          businessName: data.businessName,
          tpn: data.tpn || null,
          gstNumber: data.gstNumber || null,
          licenseNumber: data.licenseNumber || null,
          address: data.address || null,
          city: data.city || null,
          dzongkhag: data.dzongkhag || null,
          postalCode: data.postalCode || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          defaultCurrency: data.defaultCurrency,
          bankName: data.bankName || null,
          bankAccountNumber: data.bankAccountNumber || null,
          bankAccountName: data.bankAccountName || null,
          bankBranch: data.bankBranch || null,
          invoicePrefix: data.invoicePrefix,
          invoiceTerms: data.invoiceTerms || null,
          invoiceFooter: data.invoiceFooter || null,
          logoUrl: data.logoUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(teams.id, team.id));

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.UPDATE_ACCOUNT,
        timestamp: new Date(),
      });

      revalidatePath('/settings/business');
      revalidatePath('/dashboard');

      return { success: 'Business settings updated successfully' };
    } catch (error) {
      console.error('Error updating business settings:', error);
      return { error: 'Failed to update business settings' };
    }
  }
);
