'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  supplierPaymentSchema,
  deleteSupplierPaymentSchema,
  supplierAdvanceSchema,
  allocateSupplierAdvanceSchema,
  deleteSupplierAdvanceSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import {
  supplierPayments,
  supplierBills,
  activityLogs,
  supplierAdvanceSequences,
  supplierPaymentAllocations,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import Decimal from 'decimal.js';

/**
 * Record a payment for a supplier bill
 */
export const recordSupplierPayment = validatedActionWithUser(
  supplierPaymentSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get the bill
      const [bill] = await db
        .select()
        .from(supplierBills)
        .where(
          and(
            eq(supplierBills.id, data.billId),
            eq(supplierBills.teamId, team.id)
          )
        )
        .limit(1);

      if (!bill) {
        return { error: 'Bill not found' };
      }

      // Validate payment amount doesn't exceed amount due
      const amountDue = new Decimal(bill.amountDue);
      const paymentAmount = new Decimal(data.amount);

      if (paymentAmount.greaterThan(amountDue)) {
        return { error: 'Payment amount exceeds amount due' };
      }

      // Create payment in transaction
      await db.transaction(async (tx) => {
        // Insert payment record
        await tx.insert(supplierPayments).values({
          teamId: team.id,
          billId: data.billId,
          amount: data.amount.toString(),
          currency: data.currency,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          paymentGateway: data.paymentGateway || null,
          bankName: data.bankName || null,
          chequeNumber: data.chequeNumber || null,
          transactionId: data.transactionId || null,
          receiptNumber: data.receiptNumber || null,
          notes: data.notes || null,
          createdBy: user.id,
        });

        // Update bill amounts
        const newAmountPaid = new Decimal(bill.amountPaid).plus(paymentAmount);
        const newAmountDue = new Decimal(bill.totalAmount).minus(newAmountPaid);

        // Determine payment status
        let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (newAmountDue.isZero()) {
          paymentStatus = 'paid';
        } else if (newAmountPaid.greaterThan(0)) {
          paymentStatus = 'partial';
        }

        await tx
          .update(supplierBills)
          .set({
            amountPaid: newAmountPaid.toString(),
            amountDue: newAmountDue.toString(),
            paymentStatus,
            status: paymentStatus === 'paid' ? 'paid' : bill.status,
            updatedAt: new Date(),
          })
          .where(eq(supplierBills.id, data.billId));
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `RECORD_SUPPLIER_PAYMENT: ${bill.billNumber} - ${data.amount} ${data.currency}`,
        timestamp: new Date(),
      });

      revalidatePath('/purchases/bills');
      revalidatePath(`/purchases/bills/${data.billId}`);
      return { success: 'Payment recorded successfully' };
    } catch (error) {
      console.error('Error recording payment:', error);
      return { error: 'Failed to record payment' };
    }
  }
);

/**
 * Delete a supplier payment
 */
export const deleteSupplierPayment = validatedActionWithUser(
  deleteSupplierPaymentSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get the payment
      const [payment] = await db
        .select()
        .from(supplierPayments)
        .where(
          and(
            eq(supplierPayments.id, data.id),
            eq(supplierPayments.teamId, team.id)
          )
        )
        .limit(1);

      if (!payment) {
        return { error: 'Payment not found' };
      }

      // Get the bill
      const [bill] = await db
        .select()
        .from(supplierBills)
        .where(eq(supplierBills.id, payment.billId))
        .limit(1);

      if (!bill) {
        return { error: 'Bill not found' };
      }

      // Delete payment and update bill in transaction
      await db.transaction(async (tx) => {
        // Delete the payment
        await tx
          .delete(supplierPayments)
          .where(eq(supplierPayments.id, data.id));

        // Update bill amounts
        const paymentAmount = new Decimal(payment.amount);
        const newAmountPaid = new Decimal(bill.amountPaid).minus(paymentAmount);
        const newAmountDue = new Decimal(bill.totalAmount).minus(newAmountPaid);

        // Determine payment status
        let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (newAmountDue.isZero()) {
          paymentStatus = 'paid';
        } else if (newAmountPaid.greaterThan(0)) {
          paymentStatus = 'partial';
        }

        await tx
          .update(supplierBills)
          .set({
            amountPaid: newAmountPaid.toString(),
            amountDue: newAmountDue.toString(),
            paymentStatus,
            status: paymentStatus === 'paid' ? 'paid' : 'sent',
            updatedAt: new Date(),
          })
          .where(eq(supplierBills.id, payment.billId));
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `DELETE_SUPPLIER_PAYMENT: ${bill.billNumber} - ${payment.amount} ${payment.currency}`,
        timestamp: new Date(),
      });

      revalidatePath('/purchases/bills');
      revalidatePath(`/purchases/bills/${payment.billId}`);
      return { success: 'Payment deleted successfully' };
    } catch (error) {
      console.error('Error deleting payment:', error);
      return { error: 'Failed to delete payment' };
    }
  }
);

// ============================================================
// SUPPLIER ADVANCES
// ============================================================

/**
 * Record a supplier advance (prepayment)
 */
export const recordSupplierAdvance = validatedActionWithUser(
  supplierAdvanceSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Generate advance number (ADV-S-YYYY-NNNN)
      const year = new Date().getFullYear();

      await db.transaction(async (tx) => {
        // Get or create sequence record
        let [sequence] = await tx
          .select()
          .from(supplierAdvanceSequences)
          .where(
            and(
              eq(supplierAdvanceSequences.teamId, team.id),
              eq(supplierAdvanceSequences.year, year)
            )
          );

        let nextNumber = 1;
        if (sequence) {
          nextNumber = sequence.lastNumber + 1;
          // Update sequence
          await tx
            .update(supplierAdvanceSequences)
            .set({
              lastNumber: nextNumber,
              updatedAt: new Date(),
            })
            .where(eq(supplierAdvanceSequences.id, sequence.id));
        } else {
          // Create new sequence
          [sequence] = await tx
            .insert(supplierAdvanceSequences)
            .values({
              teamId: team.id,
              year,
              lastNumber: nextNumber,
            })
            .returning();
        }

        const advanceNumber = `ADV-S-${year}-${String(nextNumber).padStart(4, '0')}`;

        // Insert supplier advance (payment with type='advance', no billId)
        await tx.insert(supplierPayments).values({
          teamId: team.id,
          billId: null, // No bill for advances
          amount: data.amount.toString(),
          allocatedAmount: '0.00',
          unallocatedAmount: data.amount.toString(),
          paymentType: 'advance',
          advanceNumber,
          currency: data.currency,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          paymentGateway: data.paymentGateway || null,
          transactionId: data.transactionId || null,
          bankName: data.bankName || null,
          chequeNumber: data.chequeNumber || null,
          receiptNumber: advanceNumber, // Use advance number as receipt
          notes: data.notes || null,
          createdBy: user.id,
        });
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `RECORD_SUPPLIER_ADVANCE: ${data.amount} ${data.currency}`,
        timestamp: new Date(),
      });

      revalidatePath('/payments/advances/supplier');
      return { success: 'Supplier advance recorded successfully' };
    } catch (error) {
      console.error('Error recording supplier advance:', error);
      return { error: 'Failed to record advance' };
    }
  }
);

/**
 * Allocate supplier advance to bills
 */
export const allocateSupplierAdvance = validatedActionWithUser(
  allocateSupplierAdvanceSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get advance
      const [advance] = await db
        .select()
        .from(supplierPayments)
        .where(
          and(
            eq(supplierPayments.id, data.advanceId),
            eq(supplierPayments.teamId, team.id),
            eq(supplierPayments.paymentType, 'advance')
          )
        );

      if (!advance) {
        return { error: 'Advance not found' };
      }

      const unallocated = new Decimal(advance.unallocatedAmount);
      if (unallocated.lessThanOrEqualTo(0)) {
        return { error: 'Advance has no remaining balance' };
      }

      // Calculate total allocation
      const totalAllocation = data.allocations.reduce(
        (sum, allocation) => sum.plus(allocation.allocatedAmount),
        new Decimal(0)
      );

      // Validate total allocation doesn't exceed unallocated amount
      if (totalAllocation.greaterThan(unallocated)) {
        return {
          error: `Total allocation (${totalAllocation.toFixed(2)}) exceeds unallocated amount (${unallocated.toFixed(2)})`,
        };
      }

      // Validate each allocation doesn't exceed bill amount due
      for (const allocation of data.allocations) {
        const [bill] = await db
          .select()
          .from(supplierBills)
          .where(
            and(
              eq(supplierBills.id, allocation.billId),
              eq(supplierBills.teamId, team.id)
            )
          );

        if (!bill) {
          return { error: `Bill not found` };
        }

        const amountDue = new Decimal(bill.amountDue);
        const allocatedAmount = new Decimal(allocation.allocatedAmount);

        if (allocatedAmount.greaterThan(amountDue)) {
          return {
            error: `Allocation for bill ${bill.billNumber} (${allocatedAmount.toFixed(2)}) exceeds amount due (${amountDue.toFixed(2)})`,
          };
        }
      }

      // Process allocations in transaction
      await db.transaction(async (tx) => {
        // Update advance amounts
        const newAllocated = new Decimal(advance.allocatedAmount).plus(totalAllocation);
        const newUnallocated = unallocated.minus(totalAllocation);

        await tx
          .update(supplierPayments)
          .set({
            allocatedAmount: newAllocated.toString(),
            unallocatedAmount: newUnallocated.toString(),
          })
          .where(eq(supplierPayments.id, data.advanceId));

        // Create allocations and update bills
        for (const allocation of data.allocations) {
          // Insert allocation
          await tx.insert(supplierPaymentAllocations).values({
            teamId: team.id,
            supplierPaymentId: advance.id,
            billId: allocation.billId,
            allocatedAmount: allocation.allocatedAmount.toString(),
            createdBy: user.id,
          });

          // Get current bill
          const [bill] = await tx
            .select()
            .from(supplierBills)
            .where(eq(supplierBills.id, allocation.billId));

          // Update bill amounts
          const newAmountPaid = new Decimal(bill.amountPaid).plus(
            allocation.allocatedAmount
          );
          const newAmountDue = new Decimal(bill.totalAmount).minus(
            newAmountPaid
          );

          let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
          if (newAmountDue.isZero() || newAmountDue.lessThanOrEqualTo(0)) {
            paymentStatus = 'paid';
          } else if (newAmountPaid.greaterThan(0)) {
            paymentStatus = 'partial';
          }

          await tx
            .update(supplierBills)
            .set({
              amountPaid: newAmountPaid.toString(),
              amountDue: newAmountDue.toString(),
              paymentStatus,
              status: paymentStatus === 'paid' ? 'paid' : bill.status,
              updatedAt: new Date(),
            })
            .where(eq(supplierBills.id, allocation.billId));
        }
      });

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `ALLOCATE_SUPPLIER_ADVANCE: ${advance.advanceNumber} - ${totalAllocation.toFixed(2)} ${advance.currency}`,
        timestamp: new Date(),
      });

      revalidatePath('/payments/advances/supplier');
      revalidatePath('/purchases/bills');
      return { success: 'Advance allocated successfully' };
    } catch (error) {
      console.error('Error allocating supplier advance:', error);
      return { error: 'Failed to allocate advance' };
    }
  }
);

/**
 * Delete a supplier advance
 */
export const deleteSupplierAdvance = validatedActionWithUser(
  deleteSupplierAdvanceSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get advance
      const [advance] = await db
        .select()
        .from(supplierPayments)
        .where(
          and(
            eq(supplierPayments.id, data.id),
            eq(supplierPayments.teamId, team.id),
            eq(supplierPayments.paymentType, 'advance')
          )
        );

      if (!advance) {
        return { error: 'Advance not found' };
      }

      // Check if advance has allocations
      const allocatedAmount = new Decimal(advance.allocatedAmount);
      if (allocatedAmount.greaterThan(0)) {
        return {
          error: 'Cannot delete advance with existing allocations',
        };
      }

      // Delete advance
      await db
        .delete(supplierPayments)
        .where(eq(supplierPayments.id, data.id));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `DELETE_SUPPLIER_ADVANCE: ${advance.advanceNumber} - ${advance.amount} ${advance.currency}`,
        timestamp: new Date(),
      });

      revalidatePath('/payments/advances/supplier');
      return { success: 'Advance deleted successfully' };
    } catch (error) {
      console.error('Error deleting supplier advance:', error);
      return { error: 'Failed to delete advance' };
    }
  }
);
