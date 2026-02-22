'use server';

import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import {
  supplierBillSchema,
  updateSupplierBillSchema,
  deleteSupplierBillSchema,
  cancelSupplierBillSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import {
  supplierBills,
  supplierBillItems,
  activityLogs,
  ActivityType,
  supplierPaymentAllocations,
  supplierPayments,
  gstPeriodLocks,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateBillNumber } from './numbering';
import { calculateBillItem, calculateBillTotals } from './calculations';

/**
 * Create a new supplier bill
 */
export const createSupplierBill = validatedActionWithUser(
  supplierBillSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Calculate totals for all items
      const billTotals = calculateBillTotals(data.items);

      // Create bill in transaction
      const [bill] = await db.transaction(async (tx) => {
        // Create the bill
        const [newBill] = await tx
          .insert(supplierBills)
          .values({
            teamId: team.id,
            supplierId: data.supplierId,
            billNumber: data.billNumber,
            billDate: data.billDate,
            dueDate: data.dueDate || null,
            currency: data.currency,
            subtotal: billTotals.subtotal,
            totalTax: billTotals.totalTax,
            totalDiscount: billTotals.totalDiscount,
            totalAmount: billTotals.totalAmount,
            amountPaid: '0.00',
            amountDue: billTotals.totalAmount,
            status: 'draft',
            paymentStatus: 'unpaid',
            paymentTerms: data.paymentTerms || null,
            notes: data.notes || null,
            termsAndConditions: data.termsAndConditions || null,
            createdBy: user.id,
          })
          .returning();

        // Create bill items
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          const calculated = calculateBillItem({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent || 0,
            taxRate: item.taxRate,
            isTaxExempt: item.isTaxExempt || false,
          });

          await tx.insert(supplierBillItems).values({
            billId: newBill.id,
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity.toString(),
            unit: item.unit || null,
            unitPrice: item.unitPrice.toString(),
            lineTotal: calculated.subtotal,
            discountPercent: item.discountPercent?.toString() || '0',
            discountAmount: calculated.discountAmount,
            taxRate: item.taxRate.toString(),
            taxAmount: calculated.taxAmount,
            isTaxExempt: item.isTaxExempt || false,
            gstClassification: item.gstClassification || 'STANDARD',
            itemTotal: calculated.itemTotal,
            sortOrder: i,
          });
        }

        return [newBill];
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `CREATE_SUPPLIER_BILL: ${bill.billNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/purchases/bills');
      return {
        success: 'Supplier bill created successfully',
        billId: bill.id,
      };
    } catch (error) {
      console.error('Error creating supplier bill:', error);
      return { error: 'Failed to create supplier bill' };
    }
  }
);

/**
 * Update an existing supplier bill (only if not locked)
 */
export const updateSupplierBill = validatedActionWithUser(
  updateSupplierBillSchema,
  async (data, _, user) => {
    try {
      const { id, ...billData } = data;
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check if bill exists and is not locked
      const [existingBill] = await db
        .select()
        .from(supplierBills)
        .where(and(eq(supplierBills.id, id), eq(supplierBills.teamId, team.id)))
        .limit(1);

      if (!existingBill) {
        return { error: 'Bill not found' };
      }

      if (existingBill.isLocked) {
        return { error: 'Cannot edit a locked bill' };
      }

      // Calculate new totals
      const billTotals = calculateBillTotals(billData.items);

      // Update in transaction
      await db.transaction(async (tx) => {
        // Update the bill
        await tx
          .update(supplierBills)
          .set({
            supplierId: billData.supplierId,
            billNumber: billData.billNumber,
            billDate: billData.billDate,
            dueDate: billData.dueDate || null,
            currency: billData.currency,
            subtotal: billTotals.subtotal,
            totalTax: billTotals.totalTax,
            totalDiscount: billTotals.totalDiscount,
            totalAmount: billTotals.totalAmount,
            amountDue: billTotals.totalAmount, // Recalculate if needed based on payments
            paymentTerms: billData.paymentTerms || null,
            notes: billData.notes || null,
            termsAndConditions: billData.termsAndConditions || null,
            updatedAt: new Date(),
          })
          .where(eq(supplierBills.id, id));

        // Delete existing items
        await tx.delete(supplierBillItems).where(eq(supplierBillItems.billId, id));

        // Insert new items
        for (let i = 0; i < billData.items.length; i++) {
          const item = billData.items[i];
          const calculated = calculateBillItem({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent || 0,
            taxRate: item.taxRate,
            isTaxExempt: item.isTaxExempt || false,
          });

          await tx.insert(supplierBillItems).values({
            billId: id,
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity.toString(),
            unit: item.unit || null,
            unitPrice: item.unitPrice.toString(),
            lineTotal: calculated.subtotal,
            discountPercent: item.discountPercent?.toString() || '0',
            discountAmount: calculated.discountAmount,
            taxRate: item.taxRate.toString(),
            taxAmount: calculated.taxAmount,
            isTaxExempt: item.isTaxExempt || false,
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
        action: `UPDATE_SUPPLIER_BILL: ${billData.billNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/purchases/bills');
      revalidatePath(`/purchases/bills/${id}`);
      return { success: 'Supplier bill updated successfully' };
    } catch (error) {
      console.error('Error updating supplier bill:', error);
      return { error: 'Failed to update supplier bill' };
    }
  }
);

/**
 * Delete a supplier bill (soft delete)
 */
export const deleteSupplierBill = validatedActionWithRole(
  deleteSupplierBillSchema,
  'admin',
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get bill for activity log
      const [bill] = await db
        .select()
        .from(supplierBills)
        .where(and(eq(supplierBills.id, data.id), eq(supplierBills.teamId, team.id)))
        .limit(1);

      if (!bill) {
        return { error: 'Bill not found' };
      }

      if (bill.isLocked) {
        return { error: 'Cannot delete a locked bill' };
      }

      // Update status to cancelled
      await db
        .update(supplierBills)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(and(eq(supplierBills.id, data.id), eq(supplierBills.teamId, team.id)));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `DELETE_SUPPLIER_BILL: ${bill.billNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/purchases/bills');
      return { success: 'Supplier bill deleted successfully' };
    } catch (error) {
      console.error('Error deleting supplier bill:', error);
      return { error: 'Failed to delete supplier bill' };
    }
  }
);

/**
 * Cancel a supplier bill
 * - Checks if bill is in a locked GST period
 * - Auto-reverses all payments allocated to this bill
 * - Marks the bill as cancelled with reason
 */
export const cancelSupplierBill = validatedActionWithRole(
  cancelSupplierBillSchema,
  'admin',
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get the bill
      const [bill] = await db
        .select()
        .from(supplierBills)
        .where(and(eq(supplierBills.id, data.id), eq(supplierBills.teamId, team.id)))
        .limit(1);

      if (!bill) {
        return { error: 'Bill not found' };
      }

      // Check if already cancelled
      if (bill.status === 'cancelled') {
        return { error: 'Bill is already cancelled' };
      }

      // Check if bill is in a locked GST period
      const billDate = new Date(bill.billDate);

      const [periodLock] = await db
        .select()
        .from(gstPeriodLocks)
        .where(
          and(
            eq(gstPeriodLocks.teamId, team.id),
            lte(gstPeriodLocks.periodStart, billDate),
            gte(gstPeriodLocks.periodEnd, billDate)
          )
        )
        .limit(1);

      if (periodLock) {
        return {
          error: 'Cannot cancel bill in a locked GST period. Please create a Debit Note instead.',
        };
      }

      // Get all payment allocations for this bill
      const allocations = await db
        .select({
          allocation: supplierPaymentAllocations,
          payment: supplierPayments,
        })
        .from(supplierPaymentAllocations)
        .innerJoin(supplierPayments, eq(supplierPaymentAllocations.supplierPaymentId, supplierPayments.id))
        .where(eq(supplierPaymentAllocations.billId, bill.id));

      // Cancel bill and reverse payments in a transaction
      await db.transaction(async (tx) => {
        // Reverse each payment allocation
        for (const { allocation, payment } of allocations) {
          const allocatedAmount = parseFloat(allocation.allocatedAmount);

          // Update the supplier payment to return the allocated amount
          const newAllocatedAmount = parseFloat(payment.allocatedAmount) - allocatedAmount;
          const newUnallocatedAmount = parseFloat(payment.unallocatedAmount) + allocatedAmount;

          await tx
            .update(supplierPayments)
            .set({
              allocatedAmount: newAllocatedAmount.toFixed(2),
              unallocatedAmount: newUnallocatedAmount.toFixed(2),
              reversedAt: new Date(),
              reversedReason: `Auto-reversed due to bill ${bill.billNumber} cancellation`,
            })
            .where(eq(supplierPayments.id, payment.id));

          // Delete the allocation
          await tx
            .delete(supplierPaymentAllocations)
            .where(eq(supplierPaymentAllocations.id, allocation.id));
        }

        // Update the bill to cancelled status
        await tx
          .update(supplierBills)
          .set({
            status: 'cancelled',
            paymentStatus: 'unpaid',
            amountPaid: '0.00',
            amountDue: bill.totalAmount,
            cancelledAt: new Date(),
            cancelledReason: data.reason,
            cancelledById: user.id,
            updatedAt: new Date(),
          })
          .where(eq(supplierBills.id, bill.id));
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `CANCEL_SUPPLIER_BILL: ${bill.billNumber} - ${data.reason}`,
        timestamp: new Date(),
      });

      revalidatePath('/purchases/bills');
      revalidatePath(`/purchases/bills/${data.id}`);
      revalidatePath('/payments');
      return { success: 'Bill cancelled successfully' };
    } catch (error) {
      console.error('Error cancelling bill:', error);
      return { error: 'Failed to cancel bill' };
    }
  }
);
