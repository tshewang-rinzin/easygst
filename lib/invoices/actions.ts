'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  invoiceSchema,
  updateInvoiceSchema,
  deleteInvoiceSchema,
  lockInvoiceSchema,
  updateInvoiceStatusSchema,
  cancelInvoiceSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import {
  invoices,
  invoiceItems,
  activityLogs,
  ActivityType,
  paymentAllocations,
  customerPayments,
  gstPeriodLocks,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateInvoiceNumber } from './numbering';
import { calculateLineItem, calculateInvoiceTotals } from './calculations';
import { getGSTClassification } from './gst-classification';

/**
 * Create a new invoice with line items
 */
export const createInvoice = validatedActionWithUser(
  invoiceSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Generate invoice number (concurrency-safe)
      const invoiceNumber = await generateInvoiceNumber(
        team.id,
        team.invoicePrefix || 'INV'
      );

      // Calculate all line items
      const calculatedItems = data.items.map((item, index) => {
        const calculated = calculateLineItem({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
          taxRate: item.taxRate,
          isTaxExempt: item.isTaxExempt,
        });

        const gstClassification = getGSTClassification(item.taxRate, item.isTaxExempt);

        return {
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity.toString(),
          unit: item.unit,
          unitPrice: item.unitPrice.toString(),
          lineTotal: calculated.subtotal,
          discountPercent: (item.discountPercent || 0).toString(),
          discountAmount: calculated.discountAmount,
          taxRate: item.taxRate.toString(),
          taxAmount: calculated.taxAmount,
          isTaxExempt: item.isTaxExempt,
          gstClassification,
          itemTotal: calculated.itemTotal,
          sortOrder: index,
        };
      });

      // Calculate invoice totals
      const totals = calculateInvoiceTotals(data.items);

      // Create invoice and items in a transaction
      const [invoice] = await db.transaction(async (tx) => {
        // Create the invoice
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            teamId: team.id,
            customerId: data.customerId,
            invoiceNumber,
            invoiceDate: data.invoiceDate,
            dueDate: data.dueDate || null,
            currency: data.currency,
            subtotal: totals.subtotal,
            totalDiscount: totals.totalDiscount,
            totalTax: totals.totalTax,
            totalAmount: totals.totalAmount,
            amountPaid: '0.00',
            amountDue: totals.totalAmount,
            status: 'draft',
            paymentStatus: 'unpaid',
            isLocked: false,
            paymentTerms: data.paymentTerms || null,
            notes: data.notes || null,
            customerNotes: data.customerNotes || null,
            createdBy: user.id,
          })
          .returning();

        // Create invoice items
        await tx.insert(invoiceItems).values(
          calculatedItems.map((item) => ({
            ...item,
            invoiceId: newInvoice.id,
          }))
        );

        return [newInvoice];
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.CREATE_INVOICE}: ${invoiceNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/invoices');
      return {
        success: 'Invoice created successfully',
        invoiceId: invoice.id,
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { error: 'Failed to create invoice' };
    }
  }
);

/**
 * Update an existing invoice (only if status = 'draft' and not locked)
 */
export const updateInvoice = validatedActionWithUser(
  updateInvoiceSchema,
  async (data, _, user) => {
    try {
      const { id, ...updateData } = data;
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get the existing invoice
      const [existingInvoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.teamId, team.id)))
        .limit(1);

      if (!existingInvoice) {
        return { error: 'Invoice not found' };
      }

      // Check if invoice can be edited
      if (existingInvoice.isLocked) {
        return { error: 'Cannot edit locked invoice. Invoice has been sent.' };
      }

      if (existingInvoice.status !== 'draft') {
        return {
          error: 'Can only edit draft invoices. Create a credit note instead.',
        };
      }

      // Calculate all line items
      const calculatedItems = updateData.items.map((item, index) => {
        const calculated = calculateLineItem({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
          taxRate: item.taxRate,
          isTaxExempt: item.isTaxExempt,
        });

        const gstClassification = getGSTClassification(item.taxRate, item.isTaxExempt);

        return {
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity.toString(),
          unit: item.unit,
          unitPrice: item.unitPrice.toString(),
          lineTotal: calculated.subtotal,
          discountPercent: (item.discountPercent || 0).toString(),
          discountAmount: calculated.discountAmount,
          taxRate: item.taxRate.toString(),
          taxAmount: calculated.taxAmount,
          isTaxExempt: item.isTaxExempt,
          gstClassification,
          itemTotal: calculated.itemTotal,
          sortOrder: index,
        };
      });

      // Calculate invoice totals
      const totals = calculateInvoiceTotals(updateData.items);

      // Update invoice and items in a transaction
      await db.transaction(async (tx) => {
        // Update the invoice
        await tx
          .update(invoices)
          .set({
            customerId: updateData.customerId,
            invoiceDate: updateData.invoiceDate,
            dueDate: updateData.dueDate || null,
            currency: updateData.currency,
            subtotal: totals.subtotal,
            totalDiscount: totals.totalDiscount,
            totalTax: totals.totalTax,
            totalAmount: totals.totalAmount,
            amountDue: totals.totalAmount, // Reset amount due on update
            paymentTerms: updateData.paymentTerms || null,
            notes: updateData.notes || null,
            customerNotes: updateData.customerNotes || null,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, id));

        // Delete existing items
        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

        // Create new items
        await tx.insert(invoiceItems).values(
          calculatedItems.map((item) => ({
            ...item,
            invoiceId: id,
          }))
        );
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.EDIT_INVOICE}: ${existingInvoice.invoiceNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/invoices');
      revalidatePath(`/invoices/${id}`);
      return { success: 'Invoice updated successfully' };
    } catch (error) {
      console.error('Error updating invoice:', error);
      return { error: 'Failed to update invoice' };
    }
  }
);

/**
 * Delete an invoice (soft delete, only drafts)
 */
export const deleteInvoice = validatedActionWithUser(
  deleteInvoiceSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get the invoice
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, data.id), eq(invoices.teamId, team.id)))
        .limit(1);

      if (!invoice) {
        return { error: 'Invoice not found' };
      }

      // Only allow deleting draft invoices
      if (invoice.status !== 'draft') {
        return {
          error:
            'Cannot delete non-draft invoices. Cancel the invoice instead.',
        };
      }

      // Delete invoice items and invoice in transaction
      await db.transaction(async (tx) => {
        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, data.id));
        await tx.delete(invoices).where(eq(invoices.id, data.id));
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.DELETE_INVOICE}: ${invoice.invoiceNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/invoices');
      return { success: 'Invoice deleted successfully' };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return { error: 'Failed to delete invoice' };
    }
  }
);

/**
 * Lock an invoice (prevent further edits)
 * This happens when an invoice is sent
 */
export const lockInvoice = validatedActionWithUser(
  lockInvoiceSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      await db
        .update(invoices)
        .set({
          isLocked: true,
          lockedAt: new Date(),
          lockedBy: user.id,
          status: 'sent',
          updatedAt: new Date(),
        })
        .where(and(eq(invoices.id, data.id), eq(invoices.teamId, team.id)));

      revalidatePath('/invoices');
      revalidatePath(`/invoices/${data.id}`);
      return { success: 'Invoice locked successfully' };
    } catch (error) {
      console.error('Error locking invoice:', error);
      return { error: 'Failed to lock invoice' };
    }
  }
);

/**
 * Update invoice status
 */
export const updateInvoiceStatus = validatedActionWithUser(
  updateInvoiceStatusSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      await db
        .update(invoices)
        .set({
          status: data.status,
          updatedAt: new Date(),
        })
        .where(and(eq(invoices.id, data.id), eq(invoices.teamId, team.id)));

      revalidatePath('/invoices');
      revalidatePath(`/invoices/${data.id}`);
      return { success: 'Invoice status updated successfully' };
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return { error: 'Failed to update invoice status' };
    }
  }
);

/**
 * Cancel an invoice
 * - Checks if invoice is in a locked GST period
 * - Auto-reverses all payments allocated to this invoice
 * - Marks the invoice as cancelled with reason
 */
export const cancelInvoice = validatedActionWithUser(
  cancelInvoiceSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get the invoice
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, data.id), eq(invoices.teamId, team.id)))
        .limit(1);

      if (!invoice) {
        return { error: 'Invoice not found' };
      }

      // Check if already cancelled
      if (invoice.status === 'cancelled') {
        return { error: 'Invoice is already cancelled' };
      }

      // Check if invoice is in a locked GST period
      const invoiceDate = new Date(invoice.invoiceDate);
      const periodStart = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 1);
      const periodEnd = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, 0);

      const [periodLock] = await db
        .select()
        .from(gstPeriodLocks)
        .where(
          and(
            eq(gstPeriodLocks.teamId, team.id),
            lte(gstPeriodLocks.periodStart, invoiceDate),
            gte(gstPeriodLocks.periodEnd, invoiceDate)
          )
        )
        .limit(1);

      if (periodLock) {
        return {
          error: 'Cannot cancel invoice in a locked GST period. Please create a Credit Note instead.',
        };
      }

      // Get all payment allocations for this invoice
      const allocations = await db
        .select({
          allocation: paymentAllocations,
          payment: customerPayments,
        })
        .from(paymentAllocations)
        .innerJoin(customerPayments, eq(paymentAllocations.customerPaymentId, customerPayments.id))
        .where(eq(paymentAllocations.invoiceId, invoice.id));

      // Cancel invoice and reverse payments in a transaction
      await db.transaction(async (tx) => {
        // Reverse each payment allocation
        for (const { allocation, payment } of allocations) {
          const allocatedAmount = parseFloat(allocation.allocatedAmount);

          // Update the customer payment to return the allocated amount
          const newAllocatedAmount = parseFloat(payment.allocatedAmount) - allocatedAmount;
          const newUnallocatedAmount = parseFloat(payment.unallocatedAmount) + allocatedAmount;

          await tx
            .update(customerPayments)
            .set({
              allocatedAmount: newAllocatedAmount.toFixed(2),
              unallocatedAmount: newUnallocatedAmount.toFixed(2),
              reversedAt: new Date(),
              reversedReason: `Auto-reversed due to invoice ${invoice.invoiceNumber} cancellation`,
            })
            .where(eq(customerPayments.id, payment.id));

          // Delete the allocation
          await tx
            .delete(paymentAllocations)
            .where(eq(paymentAllocations.id, allocation.id));
        }

        // Update the invoice to cancelled status
        await tx
          .update(invoices)
          .set({
            status: 'cancelled',
            paymentStatus: 'unpaid',
            amountPaid: '0.00',
            amountDue: invoice.totalAmount,
            cancelledAt: new Date(),
            cancelledReason: data.reason,
            cancelledById: user.id,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoice.id));
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `CANCEL_INVOICE: ${invoice.invoiceNumber} - ${data.reason}`,
        timestamp: new Date(),
      });

      revalidatePath('/invoices');
      revalidatePath(`/invoices/${data.id}`);
      revalidatePath('/payments');
      return { success: 'Invoice cancelled successfully' };
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      return { error: 'Failed to cancel invoice' };
    }
  }
);
