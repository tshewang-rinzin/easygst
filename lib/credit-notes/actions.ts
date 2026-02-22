'use server';

import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import {
  creditNoteSchema,
  updateCreditNoteSchema,
  deleteCreditNoteSchema,
  issueCreditNoteSchema,
  applyCreditNoteSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import {
  creditNotes,
  creditNoteItems,
  creditNoteApplications,
  activityLogs,
  invoices,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateCreditNoteNumber } from './numbering';
import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate credit note item totals
 */
function calculateCreditNoteItem(item: {
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
 * Calculate credit note totals
 */
function calculateCreditNoteTotals(
  items: Array<{
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>
) {
  let subtotal = new Decimal(0);
  let totalTax = new Decimal(0);

  for (const item of items) {
    const calculated = calculateCreditNoteItem(item);
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
 * Create a new credit note
 */
export const createCreditNote = validatedActionWithUser(
  creditNoteSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Calculate totals
      const totals = calculateCreditNoteTotals(data.items);

      // Validate credit note amount doesn't exceed invoice total (if linked)
      if (data.invoiceId) {
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(and(eq(invoices.id, data.invoiceId), eq(invoices.teamId, team.id)))
          .limit(1);

        if (!invoice) {
          return { error: 'Linked invoice not found' };
        }

        if (invoice.customerId !== data.customerId) {
          return { error: 'Invoice does not belong to selected customer' };
        }

        const creditNoteTotal = new Decimal(totals.totalAmount);
        const invoiceTotal = new Decimal(invoice.totalAmount);
        if (creditNoteTotal.gt(invoiceTotal)) {
          return { error: `Credit note amount (${totals.totalAmount}) exceeds invoice total (${invoice.totalAmount})` };
        }
      }

      // Generate credit note number
      const creditNoteNumber = await generateCreditNoteNumber(team.id);

      // Create credit note in transaction
      const [creditNote] = await db.transaction(async (tx) => {
        // Create the credit note
        const [newCreditNote] = await tx
          .insert(creditNotes)
          .values({
            teamId: team.id,
            customerId: data.customerId,
            invoiceId: data.invoiceId || null,
            creditNoteNumber,
            creditNoteDate: data.creditNoteDate,
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
            customerNotes: data.customerNotes || null,
            createdBy: user.id,
          })
          .returning();

        // Create credit note items
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          const calculated = calculateCreditNoteItem({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
          });

          await tx.insert(creditNoteItems).values({
            creditNoteId: newCreditNote.id,
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

        return [newCreditNote];
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `CREATE_CREDIT_NOTE: ${creditNoteNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/sales/credit-notes');
      return {
        success: 'Credit note created successfully',
        creditNoteId: creditNote.id,
      };
    } catch (error) {
      console.error('Error creating credit note:', error);
      return { error: 'Failed to create credit note' };
    }
  }
);

/**
 * Update a credit note (only if draft)
 */
export const updateCreditNote = validatedActionWithUser(
  updateCreditNoteSchema,
  async (data, _, user) => {
    try {
      const { id, ...updateData } = data;
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check if credit note exists and is draft
      const [existingCreditNote] = await db
        .select()
        .from(creditNotes)
        .where(and(eq(creditNotes.id, id), eq(creditNotes.teamId, team.id)))
        .limit(1);

      if (!existingCreditNote) {
        return { error: 'Credit note not found' };
      }

      if (existingCreditNote.status !== 'draft') {
        return { error: 'Can only edit draft credit notes' };
      }

      // Calculate new totals
      const totals = calculateCreditNoteTotals(updateData.items);

      // Validate credit note amount doesn't exceed invoice total (if linked)
      if (updateData.invoiceId) {
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(and(eq(invoices.id, updateData.invoiceId), eq(invoices.teamId, team.id)))
          .limit(1);

        if (!invoice) {
          return { error: 'Linked invoice not found' };
        }

        if (invoice.customerId !== updateData.customerId) {
          return { error: 'Invoice does not belong to selected customer' };
        }

        const creditNoteTotal = new Decimal(totals.totalAmount);
        const invoiceTotal = new Decimal(invoice.totalAmount);
        if (creditNoteTotal.gt(invoiceTotal)) {
          return { error: `Credit note amount (${totals.totalAmount}) exceeds invoice total (${invoice.totalAmount})` };
        }
      }

      // Update in transaction
      await db.transaction(async (tx) => {
        // Update the credit note
        await tx
          .update(creditNotes)
          .set({
            customerId: updateData.customerId,
            invoiceId: updateData.invoiceId || null,
            creditNoteDate: updateData.creditNoteDate,
            currency: updateData.currency,
            subtotal: totals.subtotal,
            totalTax: totals.totalTax,
            totalAmount: totals.totalAmount,
            unappliedAmount: totals.totalAmount,
            reason: updateData.reason,
            notes: updateData.notes || null,
            customerNotes: updateData.customerNotes || null,
            updatedAt: new Date(),
          })
          .where(eq(creditNotes.id, id));

        // Delete existing items
        await tx.delete(creditNoteItems).where(eq(creditNoteItems.creditNoteId, id));

        // Insert new items
        for (let i = 0; i < updateData.items.length; i++) {
          const item = updateData.items[i];
          const calculated = calculateCreditNoteItem({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
          });

          await tx.insert(creditNoteItems).values({
            creditNoteId: id,
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
        action: `UPDATE_CREDIT_NOTE: ${existingCreditNote.creditNoteNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/sales/credit-notes');
      revalidatePath(`/sales/credit-notes/${id}`);
      return { success: 'Credit note updated successfully' };
    } catch (error) {
      console.error('Error updating credit note:', error);
      return { error: 'Failed to update credit note' };
    }
  }
);

/**
 * Delete a credit note (only if draft)
 */
export const deleteCreditNote = validatedActionWithRole(
  deleteCreditNoteSchema,
  'admin',
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get credit note
      const [creditNote] = await db
        .select()
        .from(creditNotes)
        .where(and(eq(creditNotes.id, data.id), eq(creditNotes.teamId, team.id)))
        .limit(1);

      if (!creditNote) {
        return { error: 'Credit note not found' };
      }

      if (creditNote.status !== 'draft') {
        return { error: 'Can only delete draft credit notes' };
      }

      // Delete in transaction
      await db.transaction(async (tx) => {
        await tx.delete(creditNoteItems).where(eq(creditNoteItems.creditNoteId, data.id));
        await tx.delete(creditNotes).where(eq(creditNotes.id, data.id));
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `DELETE_CREDIT_NOTE: ${creditNote.creditNoteNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/sales/credit-notes');
      return { success: 'Credit note deleted successfully' };
    } catch (error) {
      console.error('Error deleting credit note:', error);
      return { error: 'Failed to delete credit note' };
    }
  }
);

/**
 * Issue a credit note (change status from draft to issued)
 */
export const issueCreditNote = validatedActionWithUser(
  issueCreditNoteSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get credit note
      const [creditNote] = await db
        .select()
        .from(creditNotes)
        .where(and(eq(creditNotes.id, data.id), eq(creditNotes.teamId, team.id)))
        .limit(1);

      if (!creditNote) {
        return { error: 'Credit note not found' };
      }

      if (creditNote.status !== 'draft') {
        return { error: 'Credit note is already issued' };
      }

      // Update status to issued
      await db
        .update(creditNotes)
        .set({
          status: 'issued',
          updatedAt: new Date(),
        })
        .where(eq(creditNotes.id, data.id));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `ISSUE_CREDIT_NOTE: ${creditNote.creditNoteNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/sales/credit-notes');
      revalidatePath(`/sales/credit-notes/${data.id}`);
      return { success: 'Credit note issued successfully' };
    } catch (error) {
      console.error('Error issuing credit note:', error);
      return { error: 'Failed to issue credit note' };
    }
  }
);

/**
 * Apply a credit note to an invoice
 */
export const applyCreditNote = validatedActionWithUser(
  applyCreditNoteSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get credit note
      const [creditNote] = await db
        .select()
        .from(creditNotes)
        .where(and(eq(creditNotes.id, data.creditNoteId), eq(creditNotes.teamId, team.id)))
        .limit(1);

      if (!creditNote) {
        return { error: 'Credit note not found' };
      }

      if (creditNote.status !== 'issued') {
        return { error: 'Credit note must be issued before applying' };
      }

      const unappliedAmount = new Decimal(creditNote.unappliedAmount);
      const applyAmount = new Decimal(data.amount);

      if (applyAmount.gt(unappliedAmount)) {
        return { error: 'Amount exceeds unapplied balance' };
      }

      // Get invoice
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, data.invoiceId), eq(invoices.teamId, team.id)))
        .limit(1);

      if (!invoice) {
        return { error: 'Invoice not found' };
      }

      // Check customer matches
      if (invoice.customerId !== creditNote.customerId) {
        return { error: 'Credit note and invoice must be for the same customer' };
      }

      const invoiceAmountDue = new Decimal(invoice.amountDue);
      if (applyAmount.gt(invoiceAmountDue)) {
        return { error: 'Amount exceeds invoice amount due' };
      }

      // Apply credit note in transaction
      await db.transaction(async (tx) => {
        // Create application record
        await tx.insert(creditNoteApplications).values({
          teamId: team.id,
          creditNoteId: data.creditNoteId,
          invoiceId: data.invoiceId,
          appliedAmount: applyAmount.toFixed(2),
          applicationDate: new Date(),
          createdBy: user.id,
        });

        // Update credit note amounts
        const newAppliedAmount = new Decimal(creditNote.appliedAmount).plus(applyAmount);
        const newUnappliedAmount = unappliedAmount.minus(applyAmount);
        const newStatus = newUnappliedAmount.eq(0) ? 'applied' : 'partial';

        await tx
          .update(creditNotes)
          .set({
            appliedAmount: newAppliedAmount.toFixed(2),
            unappliedAmount: newUnappliedAmount.toFixed(2),
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(creditNotes.id, data.creditNoteId));

        // Update invoice amounts
        const newInvoiceAmountPaid = new Decimal(invoice.amountPaid).plus(applyAmount);
        const newInvoiceAmountDue = invoiceAmountDue.minus(applyAmount);
        const newPaymentStatus = newInvoiceAmountDue.eq(0)
          ? 'paid'
          : newInvoiceAmountPaid.gt(0)
          ? 'partial'
          : 'unpaid';

        await tx
          .update(invoices)
          .set({
            amountPaid: newInvoiceAmountPaid.toFixed(2),
            amountDue: newInvoiceAmountDue.toFixed(2),
            paymentStatus: newPaymentStatus,
            status: newPaymentStatus === 'paid' ? 'paid' : invoice.status,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, data.invoiceId));
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `APPLY_CREDIT_NOTE: ${creditNote.creditNoteNumber} to ${invoice.invoiceNumber} - ${data.amount}`,
        timestamp: new Date(),
      });

      revalidatePath('/sales/credit-notes');
      revalidatePath(`/sales/credit-notes/${data.creditNoteId}`);
      revalidatePath('/invoices');
      revalidatePath(`/invoices/${data.invoiceId}`);
      return { success: 'Credit note applied successfully' };
    } catch (error) {
      console.error('Error applying credit note:', error);
      return { error: 'Failed to apply credit note' };
    }
  }
);
