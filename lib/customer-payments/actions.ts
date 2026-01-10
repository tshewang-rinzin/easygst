'use server';

import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import {
  customerPayments,
  paymentAllocations,
  invoices,
  customerAdvanceSequences,
} from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getTeamForUser } from '@/lib/db/queries';
import {
  customerPaymentSchema,
  deleteCustomerPaymentSchema,
  customerAdvanceSchema,
  allocateCustomerAdvanceSchema,
  deleteCustomerAdvanceSchema,
} from './validation';
import Decimal from 'decimal.js';
import { sendPaymentReceiptEmail } from '@/lib/email/actions';

export const recordCustomerPayment = validatedActionWithUser(
  customerPaymentSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Unauthorized' };
      }

      // Calculate total allocation amount
      const totalAllocation = data.allocations.reduce(
        (sum, allocation) => sum.plus(allocation.allocatedAmount),
        new Decimal(0)
      );

      // Validate total allocation doesn't exceed payment amount
      if (totalAllocation.greaterThan(data.amount)) {
        return {
          error: `Total allocation (${totalAllocation.toFixed(2)}) exceeds payment amount (${data.amount.toFixed(2)})`,
        };
      }

      // Validate each allocation doesn't exceed invoice amount due
      for (const allocation of data.allocations) {
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(
            and(
              eq(invoices.id, allocation.invoiceId),
              eq(invoices.teamId, team.id),
              eq(invoices.customerId, data.customerId)
            )
          );

        if (!invoice) {
          return { error: `Invoice not found` };
        }

        const amountDue = new Decimal(invoice.amountDue);
        const allocatedAmount = new Decimal(allocation.allocatedAmount);

        if (allocatedAmount.greaterThan(amountDue)) {
          return {
            error: `Allocation for invoice ${invoice.invoiceNumber} (${allocatedAmount.toFixed(2)}) exceeds amount due (${amountDue.toFixed(2)})`,
          };
        }
      }

      // Generate receipt number (RCP-YYYY-NNNN)
      const year = new Date().getFullYear();
      const existingReceipts = await db
        .select({ receiptNumber: customerPayments.receiptNumber })
        .from(customerPayments)
        .where(eq(customerPayments.teamId, team.id))
        .orderBy(customerPayments.receiptNumber);

      let nextNumber = 1;
      if (existingReceipts.length > 0) {
        const lastReceipt = existingReceipts[existingReceipts.length - 1];
        if (lastReceipt.receiptNumber) {
          const match = lastReceipt.receiptNumber.match(/RCP-\d{4}-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
      }
      const receiptNumber = `RCP-${year}-${String(nextNumber).padStart(4, '0')}`;

      // Calculate unallocated amount
      const unallocated = new Decimal(data.amount).minus(totalAllocation);

      // Create payment in transaction
      let paymentId: string | undefined;
      await db.transaction(async (tx) => {
        // Insert customer payment
        const [payment] = await tx
          .insert(customerPayments)
          .values({
            teamId: team.id,
            customerId: data.customerId,
            amount: data.amount.toString(),
            allocatedAmount: totalAllocation.toString(),
            unallocatedAmount: unallocated.toString(),
            currency: data.currency,
            paymentDate: data.paymentDate,
            paymentMethod: data.paymentMethod,
            paymentGateway: data.paymentGateway || null,
            transactionId: data.transactionId || null,
            bankName: data.bankName || null,
            chequeNumber: data.chequeNumber || null,
            receiptNumber: receiptNumber,
            notes: data.notes || null,
            createdBy: user.id,
          })
          .returning();

        if (payment) {
          paymentId = payment.id;
        }

        // Create allocations and update invoices
        for (const allocation of data.allocations) {
          // Insert allocation
          await tx.insert(paymentAllocations).values({
            teamId: team.id,
            customerPaymentId: payment.id,
            invoiceId: allocation.invoiceId,
            allocatedAmount: allocation.allocatedAmount.toString(),
            createdBy: user.id,
          });

          // Get current invoice
          const [invoice] = await tx
            .select()
            .from(invoices)
            .where(eq(invoices.id, allocation.invoiceId));

          // Update invoice amounts
          const newAmountPaid = new Decimal(invoice.amountPaid).plus(
            allocation.allocatedAmount
          );
          const newAmountDue = new Decimal(invoice.totalAmount).minus(
            newAmountPaid
          );

          let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
          if (newAmountDue.isZero() || newAmountDue.lessThanOrEqualTo(0)) {
            paymentStatus = 'paid';
          } else if (newAmountPaid.greaterThan(0)) {
            paymentStatus = 'partial';
          }

          await tx
            .update(invoices)
            .set({
              amountPaid: newAmountPaid.toString(),
              amountDue: newAmountDue.toString(),
              paymentStatus,
              status: paymentStatus === 'paid' ? 'paid' : invoice.status,
            })
            .where(eq(invoices.id, allocation.invoiceId));
        }
      });

      // Send payment receipt email (fire and forget - don't block on email)
      if (paymentId) {
        sendPaymentReceiptEmail(paymentId).catch((error) => {
          console.error('Failed to send payment receipt email:', error);
        });
      }

      revalidatePath('/payments/receive');
      revalidatePath('/sales/invoices');
      return {
        success: 'Payment recorded successfully',
        receiptNumber,
      };
    } catch (error) {
      console.error('Error recording customer payment:', error);
      return { error: 'Failed to record payment' };
    }
  }
);

export const deleteCustomerPayment = validatedActionWithUser(
  deleteCustomerPaymentSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Unauthorized' };
      }

      // Get payment with allocations
      const [payment] = await db
        .select()
        .from(customerPayments)
        .where(
          and(
            eq(customerPayments.id, data.id),
            eq(customerPayments.teamId, team.id)
          )
        );

      if (!payment) {
        return { error: 'Payment not found' };
      }

      // Get allocations
      const allocations = await db
        .select()
        .from(paymentAllocations)
        .where(eq(paymentAllocations.customerPaymentId, data.id));

      // Delete payment and reverse allocations in transaction
      await db.transaction(async (tx) => {
        // Reverse invoice amounts
        for (const allocation of allocations) {
          const [invoice] = await tx
            .select()
            .from(invoices)
            .where(eq(invoices.id, allocation.invoiceId));

          const newAmountPaid = new Decimal(invoice.amountPaid).minus(
            allocation.allocatedAmount
          );
          const newAmountDue = new Decimal(invoice.totalAmount).minus(
            newAmountPaid
          );

          let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
          if (newAmountDue.isZero()) {
            paymentStatus = 'paid';
          } else if (newAmountPaid.greaterThan(0)) {
            paymentStatus = 'partial';
          }

          await tx
            .update(invoices)
            .set({
              amountPaid: newAmountPaid.toString(),
              amountDue: newAmountDue.toString(),
              paymentStatus,
              status:
                paymentStatus === 'unpaid' || paymentStatus === 'partial'
                  ? 'sent'
                  : invoice.status,
            })
            .where(eq(invoices.id, allocation.invoiceId));
        }

        // Delete allocations
        await tx
          .delete(paymentAllocations)
          .where(eq(paymentAllocations.customerPaymentId, data.id));

        // Delete payment
        await tx
          .delete(customerPayments)
          .where(eq(customerPayments.id, data.id));
      });

      revalidatePath('/payments/receive');
      revalidatePath('/sales/invoices');
      return { success: 'Payment deleted successfully' };
    } catch (error) {
      console.error('Error deleting customer payment:', error);
      return { error: 'Failed to delete payment' };
    }
  }
);

// ============================================================
// CUSTOMER ADVANCES
// ============================================================

export const recordCustomerAdvance = validatedActionWithUser(
  customerAdvanceSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Unauthorized' };
      }

      // Generate advance number (ADV-C-YYYY-NNNN)
      const year = new Date().getFullYear();

      await db.transaction(async (tx) => {
        // Get or create sequence record
        let [sequence] = await tx
          .select()
          .from(customerAdvanceSequences)
          .where(
            and(
              eq(customerAdvanceSequences.teamId, team.id),
              eq(customerAdvanceSequences.year, year)
            )
          );

        let nextNumber = 1;
        if (sequence) {
          nextNumber = sequence.lastNumber + 1;
          // Update sequence
          await tx
            .update(customerAdvanceSequences)
            .set({
              lastNumber: nextNumber,
              updatedAt: new Date(),
            })
            .where(eq(customerAdvanceSequences.id, sequence.id));
        } else {
          // Create new sequence
          [sequence] = await tx
            .insert(customerAdvanceSequences)
            .values({
              teamId: team.id,
              year,
              lastNumber: nextNumber,
            })
            .returning();
        }

        const advanceNumber = `ADV-C-${year}-${String(nextNumber).padStart(4, '0')}`;

        // Insert customer advance (payment with type='advance')
        await tx.insert(customerPayments).values({
          teamId: team.id,
          customerId: data.customerId,
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

      revalidatePath('/payments/advances/customer');
      return { success: 'Customer advance recorded successfully' };
    } catch (error) {
      console.error('Error recording customer advance:', error);
      return { error: 'Failed to record advance' };
    }
  }
);

export const allocateCustomerAdvance = validatedActionWithUser(
  allocateCustomerAdvanceSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Unauthorized' };
      }

      // Get advance
      const [advance] = await db
        .select()
        .from(customerPayments)
        .where(
          and(
            eq(customerPayments.id, data.advanceId),
            eq(customerPayments.teamId, team.id),
            eq(customerPayments.paymentType, 'advance')
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

      // Validate each allocation doesn't exceed invoice amount due
      for (const allocation of data.allocations) {
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(
            and(
              eq(invoices.id, allocation.invoiceId),
              eq(invoices.teamId, team.id),
              eq(invoices.customerId, advance.customerId)
            )
          );

        if (!invoice) {
          return { error: `Invoice not found` };
        }

        const amountDue = new Decimal(invoice.amountDue);
        const allocatedAmount = new Decimal(allocation.allocatedAmount);

        if (allocatedAmount.greaterThan(amountDue)) {
          return {
            error: `Allocation for invoice ${invoice.invoiceNumber} (${allocatedAmount.toFixed(2)}) exceeds amount due (${amountDue.toFixed(2)})`,
          };
        }
      }

      // Process allocations in transaction
      await db.transaction(async (tx) => {
        // Update advance amounts
        const newAllocated = new Decimal(advance.allocatedAmount).plus(totalAllocation);
        const newUnallocated = unallocated.minus(totalAllocation);

        await tx
          .update(customerPayments)
          .set({
            allocatedAmount: newAllocated.toString(),
            unallocatedAmount: newUnallocated.toString(),
          })
          .where(eq(customerPayments.id, data.advanceId));

        // Create allocations and update invoices
        for (const allocation of data.allocations) {
          // Insert allocation
          await tx.insert(paymentAllocations).values({
            teamId: team.id,
            customerPaymentId: advance.id,
            invoiceId: allocation.invoiceId,
            allocatedAmount: allocation.allocatedAmount.toString(),
            createdBy: user.id,
          });

          // Get current invoice
          const [invoice] = await tx
            .select()
            .from(invoices)
            .where(eq(invoices.id, allocation.invoiceId));

          // Update invoice amounts
          const newAmountPaid = new Decimal(invoice.amountPaid).plus(
            allocation.allocatedAmount
          );
          const newAmountDue = new Decimal(invoice.totalAmount).minus(
            newAmountPaid
          );

          let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
          if (newAmountDue.isZero() || newAmountDue.lessThanOrEqualTo(0)) {
            paymentStatus = 'paid';
          } else if (newAmountPaid.greaterThan(0)) {
            paymentStatus = 'partial';
          }

          await tx
            .update(invoices)
            .set({
              amountPaid: newAmountPaid.toString(),
              amountDue: newAmountDue.toString(),
              paymentStatus,
              status: paymentStatus === 'paid' ? 'paid' : invoice.status,
            })
            .where(eq(invoices.id, allocation.invoiceId));
        }
      });

      revalidatePath('/payments/advances/customer');
      revalidatePath('/invoices');
      return { success: 'Advance allocated successfully' };
    } catch (error) {
      console.error('Error allocating customer advance:', error);
      return { error: 'Failed to allocate advance' };
    }
  }
);

export const deleteCustomerAdvance = validatedActionWithUser(
  deleteCustomerAdvanceSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Unauthorized' };
      }

      // Get advance
      const [advance] = await db
        .select()
        .from(customerPayments)
        .where(
          and(
            eq(customerPayments.id, data.id),
            eq(customerPayments.teamId, team.id),
            eq(customerPayments.paymentType, 'advance')
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
        .delete(customerPayments)
        .where(eq(customerPayments.id, data.id));

      revalidatePath('/payments/advances/customer');
      return { success: 'Advance deleted successfully' };
    } catch (error) {
      console.error('Error deleting customer advance:', error);
      return { error: 'Failed to delete advance' };
    }
  }
);
