'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  debitNoteSchema,
  updateDebitNoteSchema,
  deleteDebitNoteSchema,
  issueDebitNoteSchema,
  applyDebitNoteSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import {
  debitNotes,
  debitNoteItems,
  debitNoteApplications,
  activityLogs,
  supplierBills,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateDebitNoteNumber } from './numbering';
import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate debit note item totals
 */
function calculateDebitNoteItem(item: {
  quantity: number;
  unitPrice: number;
  taxRate: number;
}) {
  const quantity = new Decimal(item.quantity);
  const unitPrice = new Decimal(item.unitPrice);
  const taxRate = new Decimal(item.taxRate);

  const lineTotal = quantity.mul(unitPrice);
  const taxAmount = lineTotal.mul(taxRate).div(100);
  const itemTotal = lineTotal.plus(taxAmount);

  return {
    lineTotal: lineTotal.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    itemTotal: itemTotal.toFixed(2),
  };
}

/**
 * Calculate debit note totals
 */
function calculateDebitNoteTotals(
  items: Array<{
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>
) {
  let subtotal = new Decimal(0);
  let totalTax = new Decimal(0);

  for (const item of items) {
    const calculated = calculateDebitNoteItem(item);
    subtotal = subtotal.plus(calculated.lineTotal);
    totalTax = totalTax.plus(calculated.taxAmount);
  }

  const totalAmount = subtotal.plus(totalTax);

  return {
    subtotal: subtotal.toFixed(2),
    totalTax: totalTax.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
  };
}

/**
 * Create a new debit note
 */
export const createDebitNote = validatedActionWithUser(
  debitNoteSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Calculate totals
      const totals = calculateDebitNoteTotals(data.items);

      // Validate debit note amount doesn't exceed bill total (if linked)
      if (data.billId) {
        const [bill] = await db
          .select()
          .from(supplierBills)
          .where(and(eq(supplierBills.id, data.billId), eq(supplierBills.teamId, team.id)))
          .limit(1);

        if (!bill) {
          return { error: 'Linked bill not found' };
        }

        if (bill.supplierId !== data.supplierId) {
          return { error: 'Bill does not belong to selected supplier' };
        }

        const debitNoteTotal = new Decimal(totals.totalAmount);
        const billTotal = new Decimal(bill.totalAmount);
        if (debitNoteTotal.gt(billTotal)) {
          return { error: `Debit note amount (${totals.totalAmount}) exceeds bill total (${bill.totalAmount})` };
        }
      }

      // Generate debit note number
      const debitNoteNumber = await generateDebitNoteNumber(team.id);

      // Create debit note in transaction
      const [debitNote] = await db.transaction(async (tx) => {
        // Create the debit note
        const [newDebitNote] = await tx
          .insert(debitNotes)
          .values({
            teamId: team.id,
            supplierId: data.supplierId,
            billId: data.billId || null,
            debitNoteNumber,
            debitNoteDate: data.debitNoteDate,
            currency: data.currency,
            subtotal: totals.subtotal,
            totalTax: totals.totalTax,
            totalAmount: totals.totalAmount,
            appliedAmount: '0.00',
            unappliedAmount: totals.totalAmount,
            refundedAmount: '0.00',
            status: 'draft',
            reason: data.reason,
            notes: data.notes || null,
            supplierNotes: data.supplierNotes || null,
            createdBy: user.id,
          })
          .returning();

        // Create debit note items
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          const calculated = calculateDebitNoteItem({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
          });

          await tx.insert(debitNoteItems).values({
            debitNoteId: newDebitNote.id,
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity.toString(),
            unit: item.unit || null,
            unitPrice: item.unitPrice.toString(),
            lineTotal: calculated.lineTotal,
            taxRate: item.taxRate.toString(),
            taxAmount: calculated.taxAmount,
            gstClassification: item.gstClassification || 'STANDARD',
            itemTotal: calculated.itemTotal,
            sortOrder: i,
          });
        }

        return [newDebitNote];
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `CREATE_DEBIT_NOTE: ${debitNoteNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/purchases/debit-notes');
      return {
        success: 'Debit note created successfully',
        debitNoteId: debitNote.id,
      };
    } catch (error) {
      console.error('Error creating debit note:', error);
      return { error: 'Failed to create debit note' };
    }
  }
);

/**
 * Update a debit note (only if draft)
 */
export const updateDebitNote = validatedActionWithUser(
  updateDebitNoteSchema,
  async (data, _, user) => {
    try {
      const { id, ...updateData } = data;
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check if debit note exists and is draft
      const [existingDebitNote] = await db
        .select()
        .from(debitNotes)
        .where(and(eq(debitNotes.id, id), eq(debitNotes.teamId, team.id)))
        .limit(1);

      if (!existingDebitNote) {
        return { error: 'Debit note not found' };
      }

      if (existingDebitNote.status !== 'draft') {
        return { error: 'Can only edit draft debit notes' };
      }

      // Calculate new totals
      const totals = calculateDebitNoteTotals(updateData.items);

      // Validate debit note amount doesn't exceed bill total (if linked)
      if (updateData.billId) {
        const [bill] = await db
          .select()
          .from(supplierBills)
          .where(and(eq(supplierBills.id, updateData.billId), eq(supplierBills.teamId, team.id)))
          .limit(1);

        if (!bill) {
          return { error: 'Linked bill not found' };
        }

        if (bill.supplierId !== updateData.supplierId) {
          return { error: 'Bill does not belong to selected supplier' };
        }

        const debitNoteTotal = new Decimal(totals.totalAmount);
        const billTotal = new Decimal(bill.totalAmount);
        if (debitNoteTotal.gt(billTotal)) {
          return { error: `Debit note amount (${totals.totalAmount}) exceeds bill total (${bill.totalAmount})` };
        }
      }

      // Update in transaction
      await db.transaction(async (tx) => {
        // Update the debit note
        await tx
          .update(debitNotes)
          .set({
            supplierId: updateData.supplierId,
            billId: updateData.billId || null,
            debitNoteDate: updateData.debitNoteDate,
            currency: updateData.currency,
            subtotal: totals.subtotal,
            totalTax: totals.totalTax,
            totalAmount: totals.totalAmount,
            unappliedAmount: totals.totalAmount,
            reason: updateData.reason,
            notes: updateData.notes || null,
            supplierNotes: updateData.supplierNotes || null,
            updatedAt: new Date(),
          })
          .where(eq(debitNotes.id, id));

        // Delete existing items
        await tx.delete(debitNoteItems).where(eq(debitNoteItems.debitNoteId, id));

        // Insert new items
        for (let i = 0; i < updateData.items.length; i++) {
          const item = updateData.items[i];
          const calculated = calculateDebitNoteItem({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
          });

          await tx.insert(debitNoteItems).values({
            debitNoteId: id,
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity.toString(),
            unit: item.unit || null,
            unitPrice: item.unitPrice.toString(),
            lineTotal: calculated.lineTotal,
            taxRate: item.taxRate.toString(),
            taxAmount: calculated.taxAmount,
            gstClassification: item.gstClassification || 'STANDARD',
            itemTotal: calculated.itemTotal,
            sortOrder: i,
          });
        }
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `UPDATE_DEBIT_NOTE: ${existingDebitNote.debitNoteNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/purchases/debit-notes');
      revalidatePath(`/purchases/debit-notes/${id}`);
      return { success: 'Debit note updated successfully' };
    } catch (error) {
      console.error('Error updating debit note:', error);
      return { error: 'Failed to update debit note' };
    }
  }
);

/**
 * Delete a debit note (only if draft)
 */
export const deleteDebitNote = validatedActionWithUser(
  deleteDebitNoteSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get debit note
      const [debitNote] = await db
        .select()
        .from(debitNotes)
        .where(and(eq(debitNotes.id, data.id), eq(debitNotes.teamId, team.id)))
        .limit(1);

      if (!debitNote) {
        return { error: 'Debit note not found' };
      }

      if (debitNote.status !== 'draft') {
        return { error: 'Can only delete draft debit notes' };
      }

      // Delete in transaction
      await db.transaction(async (tx) => {
        await tx.delete(debitNoteItems).where(eq(debitNoteItems.debitNoteId, data.id));
        await tx.delete(debitNotes).where(eq(debitNotes.id, data.id));
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `DELETE_DEBIT_NOTE: ${debitNote.debitNoteNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/purchases/debit-notes');
      return { success: 'Debit note deleted successfully' };
    } catch (error) {
      console.error('Error deleting debit note:', error);
      return { error: 'Failed to delete debit note' };
    }
  }
);

/**
 * Issue a debit note (change status from draft to issued)
 */
export const issueDebitNote = validatedActionWithUser(
  issueDebitNoteSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get debit note
      const [debitNote] = await db
        .select()
        .from(debitNotes)
        .where(and(eq(debitNotes.id, data.id), eq(debitNotes.teamId, team.id)))
        .limit(1);

      if (!debitNote) {
        return { error: 'Debit note not found' };
      }

      if (debitNote.status !== 'draft') {
        return { error: 'Debit note is already issued' };
      }

      // Update status to issued
      await db
        .update(debitNotes)
        .set({
          status: 'issued',
          updatedAt: new Date(),
        })
        .where(eq(debitNotes.id, data.id));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `ISSUE_DEBIT_NOTE: ${debitNote.debitNoteNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/purchases/debit-notes');
      revalidatePath(`/purchases/debit-notes/${data.id}`);
      return { success: 'Debit note issued successfully' };
    } catch (error) {
      console.error('Error issuing debit note:', error);
      return { error: 'Failed to issue debit note' };
    }
  }
);

/**
 * Apply a debit note to a bill
 */
export const applyDebitNote = validatedActionWithUser(
  applyDebitNoteSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get debit note
      const [debitNote] = await db
        .select()
        .from(debitNotes)
        .where(and(eq(debitNotes.id, data.debitNoteId), eq(debitNotes.teamId, team.id)))
        .limit(1);

      if (!debitNote) {
        return { error: 'Debit note not found' };
      }

      if (debitNote.status !== 'issued') {
        return { error: 'Debit note must be issued before applying' };
      }

      const unappliedAmount = new Decimal(debitNote.unappliedAmount);
      const applyAmount = new Decimal(data.amount);

      if (applyAmount.gt(unappliedAmount)) {
        return { error: 'Amount exceeds unapplied balance' };
      }

      // Get bill
      const [bill] = await db
        .select()
        .from(supplierBills)
        .where(and(eq(supplierBills.id, data.billId), eq(supplierBills.teamId, team.id)))
        .limit(1);

      if (!bill) {
        return { error: 'Bill not found' };
      }

      // Check supplier matches
      if (bill.supplierId !== debitNote.supplierId) {
        return { error: 'Debit note and bill must be for the same supplier' };
      }

      const billAmountDue = new Decimal(bill.amountDue);
      if (applyAmount.gt(billAmountDue)) {
        return { error: 'Amount exceeds bill amount due' };
      }

      // Apply debit note in transaction
      await db.transaction(async (tx) => {
        // Create application record
        await tx.insert(debitNoteApplications).values({
          teamId: team.id,
          debitNoteId: data.debitNoteId,
          billId: data.billId,
          appliedAmount: applyAmount.toFixed(2),
          applicationDate: new Date(),
          createdBy: user.id,
        });

        // Update debit note amounts
        const newAppliedAmount = new Decimal(debitNote.appliedAmount).plus(applyAmount);
        const newUnappliedAmount = unappliedAmount.minus(applyAmount);
        const newStatus = newUnappliedAmount.eq(0) ? 'applied' : 'partial';

        await tx
          .update(debitNotes)
          .set({
            appliedAmount: newAppliedAmount.toFixed(2),
            unappliedAmount: newUnappliedAmount.toFixed(2),
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(debitNotes.id, data.debitNoteId));

        // Update bill amounts
        const newBillAmountPaid = new Decimal(bill.amountPaid).plus(applyAmount);
        const newBillAmountDue = billAmountDue.minus(applyAmount);
        const newPaymentStatus = newBillAmountDue.eq(0)
          ? 'paid'
          : newBillAmountPaid.gt(0)
          ? 'partial'
          : 'unpaid';

        await tx
          .update(supplierBills)
          .set({
            amountPaid: newBillAmountPaid.toFixed(2),
            amountDue: newBillAmountDue.toFixed(2),
            paymentStatus: newPaymentStatus,
            status: newPaymentStatus === 'paid' ? 'paid' : bill.status,
            updatedAt: new Date(),
          })
          .where(eq(supplierBills.id, data.billId));
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `APPLY_DEBIT_NOTE: ${debitNote.debitNoteNumber} to ${bill.billNumber} - ${data.amount}`,
        timestamp: new Date(),
      });

      revalidatePath('/purchases/debit-notes');
      revalidatePath(`/purchases/debit-notes/${data.debitNoteId}`);
      revalidatePath('/purchases/bills');
      revalidatePath(`/purchases/bills/${data.billId}`);
      return { success: 'Debit note applied successfully' };
    } catch (error) {
      console.error('Error applying debit note:', error);
      return { error: 'Failed to apply debit note' };
    }
  }
);
