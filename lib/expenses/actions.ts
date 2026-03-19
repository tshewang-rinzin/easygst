'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  createExpenseSchema,
  updateExpenseSchema,
  deleteExpenseSchema,
  approveExpenseSchema,
  voidExpenseSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import {
  expenses,
  expenseSequences,
  expenseCategories,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

async function generateExpenseNumber(teamId: string): Promise<string> {
  const year = new Date().getFullYear();

  const result = await db.transaction(async (tx) => {
    // Upsert sequence
    const existing = await tx
      .select()
      .from(expenseSequences)
      .where(eq(expenseSequences.teamId, teamId))
      .for('update');

    let nextNumber: number;
    if (existing.length === 0) {
      await tx.insert(expenseSequences).values({
        teamId,
        lastNumber: 1,
        prefix: 'EXP',
      });
      nextNumber = 1;
    } else {
      nextNumber = existing[0].lastNumber + 1;
      await tx
        .update(expenseSequences)
        .set({ lastNumber: nextNumber, updatedAt: new Date() })
        .where(eq(expenseSequences.teamId, teamId));
    }

    return `EXP-${year}-${String(nextNumber).padStart(4, '0')}`;
  });

  return result;
}

export const createExpense = validatedActionWithUser(
  createExpenseSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get category for claimable calculation
      const [category] = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.id, data.expenseCategoryId));

      if (!category) return { error: 'Category not found' };

      const expenseNumber = await generateExpenseNumber(team.id);

      const gstAmount = (data.amount * data.gstRate) / 100;
      const totalAmount = data.amount + gstAmount;
      const claimablePercentage = parseFloat(category.claimablePercentage as string) || 0;
      const claimableGstAmount = (gstAmount * claimablePercentage) / 100;

      const expenseDate = new Date(data.expenseDate);
      const fiscalYear = expenseDate.getFullYear();
      const fiscalMonth = expenseDate.getMonth() + 1;

      const [expense] = await db
        .insert(expenses)
        .values({
          teamId: team.id,
          expenseCategoryId: data.expenseCategoryId,
          supplierId: data.supplierId || null,
          expenseNumber,
          expenseDate,
          description: data.description,
          referenceNumber: data.referenceNumber || null,
          currency: data.currency,
          amount: data.amount.toString(),
          gstRate: data.gstRate.toString(),
          gstAmount: gstAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          claimableGstAmount: claimableGstAmount.toFixed(2),
          paymentMethod: data.paymentMethod || null,
          paymentDate: data.paymentDate ? new Date(data.paymentDate as any) : null,
          isPaid: data.isPaid,
          paidFromAccount: data.paidFromAccount || null,
          isRecurring: data.isRecurring,
          recurringFrequency: data.recurringFrequency || null,
          notes: data.notes || null,
          fiscalYear,
          fiscalMonth,
          status: 'draft',
          createdBy: user.id,
        })
        .returning();

      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.CREATE_EXPENSE,
        ipAddress: '',
      });

      revalidatePath('/expenses');
      return { success: 'Expense created successfully', data: expense };
    } catch (error: any) {
      return { error: error.message || 'Failed to create expense' };
    }
  }
);

export const updateExpense = validatedActionWithUser(
  updateExpenseSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check expense exists and is draft
      const [existing] = await db
        .select()
        .from(expenses)
        .where(and(eq(expenses.id, data.id), eq(expenses.teamId, team.id)));

      if (!existing) return { error: 'Expense not found' };
      if (existing.status !== 'draft') return { error: 'Only draft expenses can be edited' };

      // Get category for claimable calculation
      const [category] = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.id, data.expenseCategoryId));

      if (!category) return { error: 'Category not found' };

      const gstAmount = (data.amount * data.gstRate) / 100;
      const totalAmount = data.amount + gstAmount;
      const claimablePercentage = parseFloat(category.claimablePercentage as string) || 0;
      const claimableGstAmount = (gstAmount * claimablePercentage) / 100;

      const expenseDate = new Date(data.expenseDate);

      const [expense] = await db
        .update(expenses)
        .set({
          expenseCategoryId: data.expenseCategoryId,
          supplierId: data.supplierId || null,
          expenseDate,
          description: data.description,
          referenceNumber: data.referenceNumber || null,
          currency: data.currency,
          amount: data.amount.toString(),
          gstRate: data.gstRate.toString(),
          gstAmount: gstAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          claimableGstAmount: claimableGstAmount.toFixed(2),
          paymentMethod: data.paymentMethod || null,
          paymentDate: data.paymentDate ? new Date(data.paymentDate as any) : null,
          isPaid: data.isPaid,
          paidFromAccount: data.paidFromAccount || null,
          isRecurring: data.isRecurring,
          recurringFrequency: data.recurringFrequency || null,
          notes: data.notes || null,
          fiscalYear: expenseDate.getFullYear(),
          fiscalMonth: expenseDate.getMonth() + 1,
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, data.id))
        .returning();

      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.UPDATE_EXPENSE,
        ipAddress: '',
      });

      revalidatePath('/expenses');
      revalidatePath(`/expenses/${data.id}`);
      return { success: 'Expense updated successfully', data: expense };
    } catch (error: any) {
      return { error: error.message || 'Failed to update expense' };
    }
  }
);

export const deleteExpense = validatedActionWithUser(
  deleteExpenseSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [existing] = await db
        .select()
        .from(expenses)
        .where(and(eq(expenses.id, data.id), eq(expenses.teamId, team.id)));

      if (!existing) return { error: 'Expense not found' };
      if (existing.status !== 'draft') return { error: 'Only draft expenses can be deleted' };

      await db.delete(expenses).where(eq(expenses.id, data.id));

      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.DELETE_EXPENSE,
        ipAddress: '',
      });

      revalidatePath('/expenses');
      return { success: 'Expense deleted successfully' };
    } catch (error: any) {
      return { error: error.message || 'Failed to delete expense' };
    }
  }
);

export const approveExpense = validatedActionWithUser(
  approveExpenseSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [existing] = await db
        .select()
        .from(expenses)
        .where(and(eq(expenses.id, data.id), eq(expenses.teamId, team.id)));

      if (!existing) return { error: 'Expense not found' };
      if (existing.status !== 'draft') return { error: 'Only draft expenses can be approved' };

      await db
        .update(expenses)
        .set({
          status: 'approved',
          approvedBy: user.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, data.id));

      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.APPROVE_EXPENSE,
        ipAddress: '',
      });

      revalidatePath('/expenses');
      revalidatePath(`/expenses/${data.id}`);
      return { success: 'Expense approved successfully' };
    } catch (error: any) {
      return { error: error.message || 'Failed to approve expense' };
    }
  }
);

export const voidExpense = validatedActionWithUser(
  voidExpenseSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [existing] = await db
        .select()
        .from(expenses)
        .where(and(eq(expenses.id, data.id), eq(expenses.teamId, team.id)));

      if (!existing) return { error: 'Expense not found' };
      if (existing.status !== 'approved') return { error: 'Only approved expenses can be voided' };

      await db
        .update(expenses)
        .set({
          status: 'void',
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, data.id));

      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.DELETE_EXPENSE,
        ipAddress: '',
      });

      revalidatePath('/expenses');
      revalidatePath(`/expenses/${data.id}`);
      return { success: 'Expense voided successfully' };
    } catch (error: any) {
      return { error: error.message || 'Failed to void expense' };
    }
  }
);
