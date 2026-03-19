'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  deleteExpenseCategorySchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import { expenseCategories, expenses } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const DEFAULT_CATEGORIES = [
  { name: 'Electricity', code: 'ELEC', gstClaimable: 'full', defaultGstRate: '5', claimablePercentage: '100' },
  { name: 'Internet & Telecom', code: 'INET', gstClaimable: 'full', defaultGstRate: '5', claimablePercentage: '100' },
  { name: 'Water', code: 'WATER', gstClaimable: 'full', defaultGstRate: '5', claimablePercentage: '100' },
  { name: 'Office Rent', code: 'RENT', gstClaimable: 'full', defaultGstRate: '5', claimablePercentage: '100' },
  { name: 'Office Supplies', code: 'OFFICE', gstClaimable: 'full', defaultGstRate: '5', claimablePercentage: '100' },
  { name: 'Fuel & Transport', code: 'FUEL', gstClaimable: 'partial', defaultGstRate: '5', claimablePercentage: '50' },
  { name: 'Business Travel', code: 'TRAVEL', gstClaimable: 'full', defaultGstRate: '5', claimablePercentage: '100' },
  { name: 'Professional Services', code: 'PROF', gstClaimable: 'full', defaultGstRate: '5', claimablePercentage: '100' },
  { name: 'Equipment & Maintenance', code: 'EQUIP', gstClaimable: 'full', defaultGstRate: '5', claimablePercentage: '100' },
  { name: 'Entertainment', code: 'ENTERTAIN', gstClaimable: 'none', defaultGstRate: '5', claimablePercentage: '0' },
  { name: 'Insurance', code: 'INSURE', gstClaimable: 'none', defaultGstRate: '0', claimablePercentage: '0' },
  { name: 'Bank Charges', code: 'BANK', gstClaimable: 'none', defaultGstRate: '0', claimablePercentage: '0' },
  { name: 'Miscellaneous', code: 'MISC', gstClaimable: 'full', defaultGstRate: '5', claimablePercentage: '100' },
] as const;

export const createExpenseCategory = validatedActionWithUser(
  createExpenseCategorySchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [category] = await db
        .insert(expenseCategories)
        .values({
          teamId: team.id,
          name: data.name,
          code: data.code.toUpperCase(),
          description: data.description || null,
          gstClaimable: data.gstClaimable,
          defaultGstRate: data.defaultGstRate.toString(),
          claimablePercentage: data.claimablePercentage.toString(),
          accountCode: data.accountCode || null,
        })
        .returning();

      revalidatePath('/expenses/categories');
      return { success: 'Category created successfully', data: category };
    } catch (error: any) {
      if (error.message?.includes('unique') || error.code === '23505') {
        return { error: 'A category with this code already exists' };
      }
      return { error: error.message || 'Failed to create category' };
    }
  }
);

export const updateExpenseCategory = validatedActionWithUser(
  updateExpenseCategorySchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [category] = await db
        .update(expenseCategories)
        .set({
          name: data.name,
          code: data.code.toUpperCase(),
          description: data.description || null,
          gstClaimable: data.gstClaimable,
          defaultGstRate: data.defaultGstRate.toString(),
          claimablePercentage: data.claimablePercentage.toString(),
          accountCode: data.accountCode || null,
          updatedAt: new Date(),
        })
        .where(and(eq(expenseCategories.id, data.id), eq(expenseCategories.teamId, team.id)))
        .returning();

      if (!category) return { error: 'Category not found' };

      revalidatePath('/expenses/categories');
      return { success: 'Category updated successfully', data: category };
    } catch (error: any) {
      if (error.message?.includes('unique') || error.code === '23505') {
        return { error: 'A category with this code already exists' };
      }
      return { error: error.message || 'Failed to update category' };
    }
  }
);

export const deleteExpenseCategory = validatedActionWithUser(
  deleteExpenseCategorySchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check if any expenses reference this category
      const [expenseCount] = await db
        .select({ count: eq(expenses.expenseCategoryId, data.id) })
        .from(expenses)
        .where(eq(expenses.expenseCategoryId, data.id))
        .limit(1);

      const hasExpenses = await db
        .select({ id: expenses.id })
        .from(expenses)
        .where(eq(expenses.expenseCategoryId, data.id))
        .limit(1);

      if (hasExpenses.length > 0) {
        return { error: 'Cannot delete category with existing expenses' };
      }

      await db
        .delete(expenseCategories)
        .where(and(eq(expenseCategories.id, data.id), eq(expenseCategories.teamId, team.id)));

      revalidatePath('/expenses/categories');
      return { success: 'Category deleted successfully' };
    } catch (error: any) {
      return { error: error.message || 'Failed to delete category' };
    }
  }
);

export async function seedExpenseCategories() {
  const team = await getTeamForUser();
  if (!team) return { error: 'Team not found' };

  // Check if categories already exist
  const existing = await db
    .select({ id: expenseCategories.id })
    .from(expenseCategories)
    .where(eq(expenseCategories.teamId, team.id))
    .limit(1);

  if (existing.length > 0) {
    return { error: 'Categories already exist for this team' };
  }

  await db.insert(expenseCategories).values(
    DEFAULT_CATEGORIES.map((cat) => ({
      teamId: team.id,
      name: cat.name,
      code: cat.code,
      gstClaimable: cat.gstClaimable,
      defaultGstRate: cat.defaultGstRate,
      claimablePercentage: cat.claimablePercentage,
      isSystem: true,
    }))
  );

  revalidatePath('/expenses/categories');
  return { success: 'Default categories seeded successfully' };
}
