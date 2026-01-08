'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getTeamForUser } from '@/lib/db/queries';
import { booleanCoerce } from '@/lib/validation-helpers';

// Tax Settings Validation Schema
const taxSettingsSchema = z.object({
  defaultGstRate: z.coerce
    .number()
    .min(0, 'GST rate cannot be negative')
    .max(100, 'GST rate cannot exceed 100%'),
  gstRegistered: booleanCoerce(false),
});

export type TaxSettingsFormData = z.infer<typeof taxSettingsSchema>;

/**
 * Update tax/GST settings for the team
 */
export const updateTaxSettings = validatedActionWithUser(
  taxSettingsSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      await db
        .update(teams)
        .set({
          defaultGstRate: data.defaultGstRate.toString(),
          gstRegistered: data.gstRegistered,
          updatedAt: new Date(),
        })
        .where(eq(teams.id, team.id));

      revalidatePath('/settings/tax');
      revalidatePath('/products');

      return { success: 'Tax settings updated successfully' };
    } catch (error) {
      console.error('Error updating tax settings:', error);
      return { error: 'Failed to update tax settings' };
    }
  }
);
