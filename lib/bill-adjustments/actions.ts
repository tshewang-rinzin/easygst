'use server';

import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import { billAdjustmentSchema, deleteBillAdjustmentSchema } from './validation';
import { db } from '@/lib/db/drizzle';
import { supplierBillAdjustments, supplierBills, activityLogs } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import Decimal from 'decimal.js';

/**
 * Create a bill adjustment
 */
export const createBillAdjustment = validatedActionWithUser(
  billAdjustmentSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get the bill
      const [bill] = await db
        .select()
        .from(supplierBills)
        .where(and(eq(supplierBills.id, data.billId), eq(supplierBills.teamId, team.id)))
        .limit(1);

      if (!bill) {
        return { error: 'Bill not found' };
      }

      const adjustmentAmount = new Decimal(data.amount);

      // Create adjustment and update bill in transaction
      await db.transaction(async (tx) => {
        // Create adjustment record
        await tx.insert(supplierBillAdjustments).values({
          teamId: team.id,
          billId: data.billId,
          adjustmentType: data.adjustmentType,
          amount: adjustmentAmount.toFixed(2),
          description: data.description,
          referenceNumber: data.referenceNumber || null,
          adjustmentDate: data.adjustmentDate,
          notes: data.notes || null,
          createdBy: user.id,
        });

        // Update bill amounts
        // Positive adjustment = increases amount due (late fee, debit note)
        // Negative adjustment = decreases amount due (discount, credit note)
        const currentAmountDue = new Decimal(bill.amountDue);
        const newAmountDue = currentAmountDue.plus(adjustmentAmount);

        const totalAmount = new Decimal(bill.totalAmount);
        const newTotalAmount = totalAmount.plus(adjustmentAmount);

        await tx
          .update(supplierBills)
          .set({
            totalAmount: newTotalAmount.toFixed(2),
            amountDue: newAmountDue.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(supplierBills.id, data.billId));
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `CREATE_BILL_ADJUSTMENT: ${data.adjustmentType} - ${bill.currency} ${data.amount}`,
        timestamp: new Date(),
      });

      revalidatePath('/adjustments/bills');
      revalidatePath('/purchases/bills');
      revalidatePath(`/purchases/bills/${data.billId}`);
      return { success: 'Bill adjustment created successfully' };
    } catch (error) {
      console.error('Error creating bill adjustment:', error);
      return { error: 'Failed to create bill adjustment' };
    }
  }
);

/**
 * Delete a bill adjustment and reverse the bill amounts
 */
export const deleteBillAdjustment = validatedActionWithRole(
  deleteBillAdjustmentSchema,
  'admin',
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get the adjustment
      const [adjustment] = await db
        .select()
        .from(supplierBillAdjustments)
        .where(and(eq(supplierBillAdjustments.id, data.id), eq(supplierBillAdjustments.teamId, team.id)))
        .limit(1);

      if (!adjustment) {
        return { error: 'Adjustment not found' };
      }

      // Get the bill
      const [bill] = await db
        .select()
        .from(supplierBills)
        .where(eq(supplierBills.id, adjustment.billId))
        .limit(1);

      if (!bill) {
        return { error: 'Bill not found' };
      }

      // Delete adjustment and update bill in transaction
      await db.transaction(async (tx) => {
        // Delete adjustment
        await tx.delete(supplierBillAdjustments).where(eq(supplierBillAdjustments.id, data.id));

        // Reverse the adjustment from bill amounts
        const adjustmentAmount = new Decimal(adjustment.amount);
        const currentAmountDue = new Decimal(bill.amountDue);
        const newAmountDue = currentAmountDue.minus(adjustmentAmount);

        const totalAmount = new Decimal(bill.totalAmount);
        const newTotalAmount = totalAmount.minus(adjustmentAmount);

        await tx
          .update(supplierBills)
          .set({
            totalAmount: newTotalAmount.toFixed(2),
            amountDue: newAmountDue.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(supplierBills.id, adjustment.billId));
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `DELETE_BILL_ADJUSTMENT: Adjustment deleted - ID ${data.id}`,
        timestamp: new Date(),
      });

      revalidatePath('/adjustments/bills');
      revalidatePath('/purchases/bills');
      revalidatePath(`/purchases/bills/${adjustment.billId}`);
      return { success: 'Bill adjustment deleted successfully' };
    } catch (error) {
      console.error('Error deleting bill adjustment:', error);
      return { error: 'Failed to delete bill adjustment' };
    }
  }
);
