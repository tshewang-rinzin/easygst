'use server';

import { z } from 'zod';
import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { bankAccounts, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { bankAccountSchema } from './validation';

/**
 * Create a new bank account
 */
export const createBankAccount = validatedActionWithUser(
  bankAccountSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // If this is marked as default, unset other defaults
      if (data.isDefault) {
        await db
          .update(bankAccounts)
          .set({ isDefault: false })
          .where(eq(bankAccounts.teamId, team.id));
      }

      // Create the bank account
      const [account] = await db
        .insert(bankAccounts)
        .values({
          teamId: team.id,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          branch: data.branch || null,
          accountType: data.accountType || null,
          paymentMethod: data.paymentMethod,
          qrCodeUrl: data.qrCodeUrl || null,
          isDefault: data.isDefault,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          notes: data.notes || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.CREATE_BANK_ACCOUNT,
        timestamp: new Date(),
      });

      revalidatePath('/settings/bank-accounts');
      revalidatePath('/settings/business');

      return { success: 'Bank account added successfully', data: account };
    } catch (error) {
      console.error('Error creating bank account:', error);
      return { error: 'Failed to create bank account' };
    }
  }
);

/**
 * Update an existing bank account
 */
export const updateBankAccount = validatedActionWithUser(
  bankAccountSchema.extend({ id: z.string().uuid() }),
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Verify the account belongs to the team
      const [existingAccount] = await db
        .select()
        .from(bankAccounts)
        .where(
          and(
            eq(bankAccounts.id, data.id),
            eq(bankAccounts.teamId, team.id)
          )
        )
        .limit(1);

      if (!existingAccount) {
        return { error: 'Bank account not found' };
      }

      // If this is marked as default, unset other defaults
      if (data.isDefault) {
        await db
          .update(bankAccounts)
          .set({ isDefault: false })
          .where(
            and(
              eq(bankAccounts.teamId, team.id),
              eq(bankAccounts.id, data.id)
            )
          );
      }

      // Update the bank account
      const [account] = await db
        .update(bankAccounts)
        .set({
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          branch: data.branch || null,
          accountType: data.accountType || null,
          paymentMethod: data.paymentMethod,
          qrCodeUrl: data.qrCodeUrl || null,
          isDefault: data.isDefault,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          notes: data.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(bankAccounts.id, data.id))
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.UPDATE_BANK_ACCOUNT,
        timestamp: new Date(),
      });

      revalidatePath('/settings/bank-accounts');
      revalidatePath('/settings/business');

      return { success: 'Bank account updated successfully', data: account };
    } catch (error) {
      console.error('Error updating bank account:', error);
      return { error: 'Failed to update bank account' };
    }
  }
);

/**
 * Delete (soft delete) a bank account
 */
export const deleteBankAccount = validatedActionWithRole(
  z.object({ id: z.string().uuid() }),
  'admin',
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Verify the account belongs to the team
      const [existingAccount] = await db
        .select()
        .from(bankAccounts)
        .where(
          and(
            eq(bankAccounts.id, data.id),
            eq(bankAccounts.teamId, team.id)
          )
        )
        .limit(1);

      if (!existingAccount) {
        return { error: 'Bank account not found' };
      }

      // Soft delete by setting isActive to false
      await db
        .update(bankAccounts)
        .set({
          isActive: false,
          isDefault: false, // Cannot be default if inactive
          updatedAt: new Date(),
        })
        .where(eq(bankAccounts.id, data.id));

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.DELETE_BANK_ACCOUNT,
        timestamp: new Date(),
      });

      revalidatePath('/settings/bank-accounts');
      revalidatePath('/settings/business');

      return { success: 'Bank account deleted successfully' };
    } catch (error) {
      console.error('Error deleting bank account:', error);
      return { error: 'Failed to delete bank account' };
    }
  }
);

/**
 * Set a bank account as default
 */
export const setDefaultBankAccount = validatedActionWithUser(
  z.object({ id: z.string().uuid() }),
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Verify the account belongs to the team and is active
      const [existingAccount] = await db
        .select()
        .from(bankAccounts)
        .where(
          and(
            eq(bankAccounts.id, data.id),
            eq(bankAccounts.teamId, team.id),
            eq(bankAccounts.isActive, true)
          )
        )
        .limit(1);

      if (!existingAccount) {
        return { error: 'Bank account not found or inactive' };
      }

      // Unset all defaults for this team
      await db
        .update(bankAccounts)
        .set({ isDefault: false })
        .where(eq(bankAccounts.teamId, team.id));

      // Set this account as default
      await db
        .update(bankAccounts)
        .set({
          isDefault: true,
          updatedAt: new Date(),
        })
        .where(eq(bankAccounts.id, data.id));

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.UPDATE_BANK_ACCOUNT,
        timestamp: new Date(),
      });

      revalidatePath('/settings/bank-accounts');
      revalidatePath('/settings/business');

      return { success: 'Default bank account set successfully' };
    } catch (error) {
      console.error('Error setting default bank account:', error);
      return { error: 'Failed to set default bank account' };
    }
  }
);
