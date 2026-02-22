'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { taxClassifications, activityLogs } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  taxClassificationSchema,
  updateTaxClassificationSchema,
  deleteTaxClassificationSchema,
  type TaxClassificationInput,
  type UpdateTaxClassificationInput,
  type DeleteTaxClassificationInput,
} from './validation';
import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import { getTaxClassificationById, taxClassificationCodeExists } from './queries';
import { getTeamForUser } from '@/lib/db/queries';

async function logActivity(
  teamId: string,
  userId: string,
  action: string
) {
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action,
    ipAddress: '',
    timestamp: new Date(),
  });
}

export const createTaxClassification = validatedActionWithUser(
  taxClassificationSchema,
  async (data: TaxClassificationInput, _, user) => {
    const team = await getTeamForUser();
    if (!team) {
      return { error: 'Team not found' };
    }

    const codeUppercase = data.code.toUpperCase();

    // Check if code already exists
    const codeExists = await taxClassificationCodeExists(codeUppercase);
    if (codeExists) {
      return { error: 'A tax classification with this code already exists' };
    }

    try {
      const [classification] = await db
        .insert(taxClassifications)
        .values({
          teamId: team.id,
          code: codeUppercase,
          name: data.name,
          description: data.description || null,
          taxRate: data.taxRate.toString(),
          canClaimInputCredits: data.canClaimInputCredits,
          color: data.color,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          createdBy: user.id,
        })
        .returning();

      await logActivity(
        team.id,
        user.id,
        `CREATE_TAX_CLASSIFICATION: Created tax classification ${classification.name} (${classification.code})`
      );

      revalidatePath('/settings/tax-classifications');
      revalidatePath('/products');
      revalidatePath('/invoices');

      return {
        success: 'Tax classification created successfully',
        data: classification,
      };
    } catch (error) {
      console.error('Error creating tax classification:', error);
      return { error: 'Failed to create tax classification' };
    }
  }
);

export const updateTaxClassification = validatedActionWithUser(
  updateTaxClassificationSchema,
  async (data: UpdateTaxClassificationInput, _, user) => {
    const team = await getTeamForUser();
    if (!team) {
      return { error: 'Team not found' };
    }

    const existing = await getTaxClassificationById(data.id);
    if (!existing) {
      return { error: 'Tax classification not found' };
    }

    const codeUppercase = data.code.toUpperCase();

    // Check if code already exists (excluding current classification)
    const codeExists = await taxClassificationCodeExists(codeUppercase, data.id);
    if (!codeExists) {
      return { error: 'A tax classification with this code already exists' };
    }

    try {
      const [updated] = await db
        .update(taxClassifications)
        .set({
          code: codeUppercase,
          name: data.name,
          description: data.description || null,
          taxRate: data.taxRate.toString(),
          canClaimInputCredits: data.canClaimInputCredits,
          color: data.color,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        })
        .where(
          and(
            eq(taxClassifications.id, data.id),
            eq(taxClassifications.teamId, team.id)
          )
        )
        .returning();

      await logActivity(
        team.id,
        user.id,
        `UPDATE_TAX_CLASSIFICATION: Updated tax classification ${updated.name} (${updated.code})`
      );

      revalidatePath('/settings/tax-classifications');
      revalidatePath('/products');
      revalidatePath('/invoices');

      return {
        success: 'Tax classification updated successfully',
        data: updated,
      };
    } catch (error) {
      console.error('Error updating tax classification:', error);
      return { error: 'Failed to update tax classification' };
    }
  }
);

export const deleteTaxClassification = validatedActionWithRole(
  deleteTaxClassificationSchema,
  'admin',
  async (data: DeleteTaxClassificationInput, _, user) => {
    const team = await getTeamForUser();
    if (!team) {
      return { error: 'Team not found' };
    }

    const existing = await getTaxClassificationById(data.id);
    if (!existing) {
      return { error: 'Tax classification not found' };
    }

    try {
      // Soft delete by setting isActive to false
      await db
        .update(taxClassifications)
        .set({ isActive: false })
        .where(
          and(
            eq(taxClassifications.id, data.id),
            eq(taxClassifications.teamId, team.id)
          )
        );

      await logActivity(
        team.id,
        user.id,
        `DELETE_TAX_CLASSIFICATION: Deleted tax classification ${existing.name} (${existing.code})`
      );

      revalidatePath('/settings/tax-classifications');
      revalidatePath('/products');
      revalidatePath('/invoices');

      return { success: 'Tax classification deleted successfully' };
    } catch (error) {
      console.error('Error deleting tax classification:', error);
      return { error: 'Failed to delete tax classification' };
    }
  }
);

export async function seedDefaultTaxClassifications(teamId: string, userId: string) {
  const defaultClassifications = [
    {
      code: 'STANDARD',
      name: 'Standard-Rated (5%)',
      description: 'Most goods and services - GST charged at 5%, input credits claimable',
      taxRate: '5.00',
      canClaimInputCredits: true,
      color: 'blue',
      sortOrder: 1,
    },
    {
      code: 'ZERO_RATED',
      name: 'Zero-Rated (0%)',
      description: 'Special supplies (e.g., exports) - 0% GST charged, input credits claimable',
      taxRate: '0.00',
      canClaimInputCredits: true,
      color: 'green',
      sortOrder: 2,
    },
    {
      code: 'EXEMPT',
      name: 'Exempt',
      description: 'Specific supplies (e.g., financial services, healthcare) - no GST charged, no input credits',
      taxRate: '0.00',
      canClaimInputCredits: false,
      color: 'gray',
      sortOrder: 3,
    },
  ];

  try {
    for (const classification of defaultClassifications) {
      await db.insert(taxClassifications).values({
        teamId,
        ...classification,
        createdBy: userId,
      });
    }

    await logActivity(
      teamId,
      userId,
      'SEED_TAX_CLASSIFICATIONS: Seeded default tax classifications for Bhutan GST'
    );

    return { success: true };
  } catch (error) {
    console.error('Error seeding tax classifications:', error);
    return { success: false, error };
  }
}

/**
 * Reset tax classifications to defaults (removes all existing, adds defaults)
 */
export const resetToDefaultTaxClassifications = validatedActionWithRole(
  z.object({}),
  'owner',
  async (_, __, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Delete all existing tax classifications for this team
      await db
        .delete(taxClassifications)
        .where(eq(taxClassifications.teamId, team.id));

      // Seed default tax classifications
      await seedDefaultTaxClassifications(team.id, user.id);

      revalidatePath('/settings/tax-classifications');
      revalidatePath('/settings/tax');
      revalidatePath('/products');
      revalidatePath('/invoices');

      return { success: 'Tax classifications reset to defaults successfully' };
    } catch (error) {
      console.error('Error resetting tax classifications:', error);
      return { error: 'Failed to reset tax classifications to defaults' };
    }
  }
);
