'use server';

import { z } from 'zod';
import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
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

// Partial Team Update Schema (for simple settings updates)
const partialTeamUpdateSchema = z.object({
  invoicePrefix: z.string().max(20).optional(),
  billPrefix: z.string().max(20).optional(),
  customerAdvancePrefix: z.string().max(20).optional(),
  supplierAdvancePrefix: z.string().max(20).optional(),
  invoiceTerms: z.string().max(5000).optional(),
  invoiceFooter: z.string().max(1000).optional(),
  logoUrl: z.string().optional(),
  defaultCurrency: z.enum(['BTN', 'INR', 'USD']).optional(),
  // Template settings
  invoiceTemplate: z.enum(['classic', 'modern', 'minimal']).optional(),
  invoiceAccentColor: z.string().max(7).optional(),
  showLogo: z.boolean().optional(),
  showPaymentTerms: z.boolean().optional(),
  showCustomerNotes: z.boolean().optional(),
  showTermsAndConditions: z.boolean().optional(),
  invoiceFooterText: z.string().max(2000).optional(),
});

export type PartialTeamUpdateData = z.infer<typeof partialTeamUpdateSchema>;

/**
 * Update team settings (partial updates allowed)
 * Use for simple settings like invoice prefix
 */
export const updateTeam = validatedActionWithUser(
  partialTeamUpdateSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { success: false, message: 'Team not found' };
      }

      // Build update object with only provided fields
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.invoicePrefix !== undefined) {
        updateData.invoicePrefix = data.invoicePrefix;
      }
      if (data.billPrefix !== undefined) {
        updateData.billPrefix = data.billPrefix;
      }
      if (data.customerAdvancePrefix !== undefined) {
        updateData.customerAdvancePrefix = data.customerAdvancePrefix;
      }
      if (data.supplierAdvancePrefix !== undefined) {
        updateData.supplierAdvancePrefix = data.supplierAdvancePrefix;
      }
      if (data.invoiceTerms !== undefined) {
        updateData.invoiceTerms = data.invoiceTerms || null;
      }
      if (data.invoiceFooter !== undefined) {
        updateData.invoiceFooter = data.invoiceFooter || null;
      }
      if (data.logoUrl !== undefined) {
        updateData.logoUrl = data.logoUrl || null;
      }
      if (data.defaultCurrency !== undefined) {
        updateData.defaultCurrency = data.defaultCurrency;
      }
      if (data.invoiceTemplate !== undefined) {
        updateData.invoiceTemplate = data.invoiceTemplate;
      }
      if (data.invoiceAccentColor !== undefined) {
        updateData.invoiceAccentColor = data.invoiceAccentColor;
      }
      if (data.showLogo !== undefined) {
        updateData.showLogo = data.showLogo;
      }
      if (data.showPaymentTerms !== undefined) {
        updateData.showPaymentTerms = data.showPaymentTerms;
      }
      if (data.showCustomerNotes !== undefined) {
        updateData.showCustomerNotes = data.showCustomerNotes;
      }
      if (data.showTermsAndConditions !== undefined) {
        updateData.showTermsAndConditions = data.showTermsAndConditions;
      }
      if (data.invoiceFooterText !== undefined) {
        updateData.invoiceFooterText = data.invoiceFooterText || null;
      }

      await db.update(teams).set(updateData).where(eq(teams.id, team.id));

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.UPDATE_ACCOUNT,
        timestamp: new Date(),
      });

      revalidatePath('/settings');
      revalidatePath('/settings/numbering');
      revalidatePath('/settings/templates');

      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      console.error('Error updating team settings:', error);
      return { success: false, message: 'Failed to update settings' };
    }
  }
);

/**
 * Update business settings for DRC compliance
 * Includes TPN, banking details, invoice configuration
 */
export const updateBusinessSettings = validatedActionWithRole(
  businessSettingsSchema,
  'owner',
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
