'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { invoiceAdjustments, invoices, activityLogs, ActivityType } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import Decimal from 'decimal.js';

// Adjustment validation schema
const adjustmentSchema = z.object({
  invoiceId: z.coerce.number().min(1, 'Invoice is required'),
  adjustmentType: z.enum(['discount', 'late_fee', 'credit_note', 'debit_note', 'bank_charges', 'other']),
  amount: z.coerce
    .number()
    .refine((val) => val !== 0, 'Amount cannot be zero'),
  description: z.string().min(1, 'Description is required').max(500),
  referenceNumber: z.string().max(100).optional().or(z.literal('')),
  adjustmentDate: z.coerce.date(),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

const deleteAdjustmentSchema = z.object({
  id: z.coerce.number(),
});

/**
 * Create an invoice adjustment
 */
export const createAdjustment = validatedActionWithUser(
  adjustmentSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get the invoice
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, data.invoiceId), eq(invoices.teamId, team.id)))
        .limit(1);

      if (!invoice) {
        return { error: 'Invoice not found' };
      }

      const adjustmentAmount = new Decimal(data.amount);

      // Create adjustment and update invoice in transaction
      await db.transaction(async (tx) => {
        // Create adjustment record
        await tx.insert(invoiceAdjustments).values({
          teamId: team.id,
          invoiceId: data.invoiceId,
          adjustmentType: data.adjustmentType,
          amount: adjustmentAmount.toFixed(2),
          description: data.description,
          referenceNumber: data.referenceNumber || null,
          adjustmentDate: data.adjustmentDate,
          notes: data.notes || null,
          createdBy: user.id,
        });

        // Update invoice amounts
        // Positive adjustment = increases amount due (late fee, debit note)
        // Negative adjustment = decreases amount due (discount, credit note)
        const currentAmountDue = new Decimal(invoice.amountDue);
        const newAmountDue = currentAmountDue.plus(adjustmentAmount);

        const totalAmount = new Decimal(invoice.totalAmount);
        const newTotalAmount = totalAmount.plus(adjustmentAmount);

        await tx
          .update(invoices)
          .set({
            totalAmount: newTotalAmount.toFixed(2),
            amountDue: newAmountDue.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, data.invoiceId));
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.CREATE_INVOICE}: Adjustment ${data.adjustmentType} - ${invoice.currency} ${data.amount}`,
        timestamp: new Date(),
      });

      revalidatePath('/adjustments');
      revalidatePath('/invoices');
      revalidatePath(`/invoices/${data.invoiceId}`);
      return { success: 'Adjustment created successfully' };
    } catch (error) {
      console.error('Error creating adjustment:', error);
      return { error: 'Failed to create adjustment' };
    }
  }
);

/**
 * Delete an adjustment and reverse the invoice amounts
 */
export const deleteAdjustment = validatedActionWithUser(
  deleteAdjustmentSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get the adjustment
      const [adjustment] = await db
        .select()
        .from(invoiceAdjustments)
        .where(and(eq(invoiceAdjustments.id, data.id), eq(invoiceAdjustments.teamId, team.id)))
        .limit(1);

      if (!adjustment) {
        return { error: 'Adjustment not found' };
      }

      // Get the invoice
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, adjustment.invoiceId))
        .limit(1);

      if (!invoice) {
        return { error: 'Invoice not found' };
      }

      // Delete adjustment and update invoice in transaction
      await db.transaction(async (tx) => {
        // Delete adjustment
        await tx.delete(invoiceAdjustments).where(eq(invoiceAdjustments.id, data.id));

        // Reverse the adjustment from invoice amounts
        const adjustmentAmount = new Decimal(adjustment.amount);
        const currentAmountDue = new Decimal(invoice.amountDue);
        const newAmountDue = currentAmountDue.minus(adjustmentAmount);

        const totalAmount = new Decimal(invoice.totalAmount);
        const newTotalAmount = totalAmount.minus(adjustmentAmount);

        await tx
          .update(invoices)
          .set({
            totalAmount: newTotalAmount.toFixed(2),
            amountDue: newAmountDue.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, adjustment.invoiceId));
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.DELETE_INVOICE}: Adjustment deleted - ID ${data.id}`,
        timestamp: new Date(),
      });

      revalidatePath('/adjustments');
      revalidatePath('/invoices');
      revalidatePath(`/invoices/${adjustment.invoiceId}`);
      return { success: 'Adjustment deleted successfully' };
    } catch (error) {
      console.error('Error deleting adjustment:', error);
      return { error: 'Failed to delete adjustment' };
    }
  }
);
