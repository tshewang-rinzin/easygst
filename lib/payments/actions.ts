'use server';

import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { payments, invoices, activityLogs, ActivityType } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, sum } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import Decimal from 'decimal.js';

// Payment validation schema
const paymentSchema = z.object({
  invoiceId: z.string().uuid('Invoice is required'),
  amount: z.coerce
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .max(9999999999999.99, 'Amount is too large'),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'online', 'cheque']),
  paymentGateway: z.string().max(100).optional().or(z.literal('')),
  transactionId: z.string().max(200).optional().or(z.literal('')),
  bankName: z.string().max(100).optional().or(z.literal('')),
  chequeNumber: z.string().max(50).optional().or(z.literal('')),
  receiptNumber: z.string().max(50).optional().or(z.literal('')),
  adjustmentAmount: z.coerce
    .number()
    .min(-9999999999999.99, 'Adjustment is too large')
    .max(9999999999999.99, 'Adjustment is too large')
    .optional()
    .default(0),
  adjustmentReason: z.enum(['discount', 'late_fee', 'bank_charges', 'currency_conversion', 'other', '']).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

const deletePaymentSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Record a payment against an invoice
 */
export const recordPayment = validatedActionWithUser(
  paymentSchema,
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

      // Calculate current amount due
      const amountDue = new Decimal(invoice.amountDue);
      const paymentAmount = new Decimal(data.amount);
      const adjustmentAmount = new Decimal(data.adjustmentAmount || 0);

      // Calculate total payment including adjustment
      // Positive adjustment = adds to payment (late fee collected)
      // Negative adjustment = reduces payment (discount given)
      const totalPaymentAmount = paymentAmount.plus(adjustmentAmount);

      // Validate payment doesn't exceed amount due (considering adjustments)
      if (totalPaymentAmount.greaterThan(amountDue)) {
        return {
          error: `Total payment amount (${totalPaymentAmount.toFixed(2)}) cannot exceed amount due (${amountDue.toFixed(2)})`,
        };
      }

      // Create payment and update invoice in transaction
      await db.transaction(async (tx) => {
        // Create payment record
        await tx.insert(payments).values({
          teamId: team.id,
          invoiceId: data.invoiceId,
          amount: data.amount.toString(),
          currency: invoice.currency,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          paymentGateway: data.paymentGateway || null,
          transactionId: data.transactionId || null,
          bankName: data.bankName || null,
          chequeNumber: data.chequeNumber || null,
          adjustmentAmount: adjustmentAmount.toFixed(2),
          adjustmentReason: data.adjustmentReason || null,
          receiptNumber: data.receiptNumber || null,
          notes: data.notes || null,
          createdBy: user.id,
        });

        // Calculate new amounts (payment amount + adjustment)
        const currentPaid = new Decimal(invoice.amountPaid);
        const newAmountPaid = currentPaid.plus(totalPaymentAmount);
        const totalAmount = new Decimal(invoice.totalAmount);
        const newAmountDue = totalAmount.minus(newAmountPaid);

        // Determine payment status
        let paymentStatus: 'unpaid' | 'partial' | 'paid';
        if (newAmountPaid.greaterThanOrEqualTo(totalAmount)) {
          paymentStatus = 'paid';
        } else if (newAmountPaid.greaterThan(0)) {
          paymentStatus = 'partial';
        } else {
          paymentStatus = 'unpaid';
        }

        // Determine invoice status
        let invoiceStatus = invoice.status;
        if (paymentStatus === 'paid') {
          invoiceStatus = 'paid';
        }

        // Update invoice
        await tx
          .update(invoices)
          .set({
            amountPaid: newAmountPaid.toFixed(2),
            amountDue: newAmountDue.greaterThan(0) ? newAmountDue.toFixed(2) : '0.00',
            paymentStatus,
            status: invoiceStatus,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, data.invoiceId));
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.RECORD_PAYMENT}: ${invoice.invoiceNumber} - ${invoice.currency} ${data.amount}`,
        timestamp: new Date(),
      });

      revalidatePath('/invoices');
      revalidatePath(`/invoices/${data.invoiceId}`);
      return { success: 'Payment recorded successfully' };
    } catch (error) {
      console.error('Error recording payment:', error);
      return { error: 'Failed to record payment' };
    }
  }
);

/**
 * Delete a payment and reverse the invoice amounts
 */
export const deletePayment = validatedActionWithRole(
  deletePaymentSchema,
  'admin',
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get the payment
      const [payment] = await db
        .select()
        .from(payments)
        .where(and(eq(payments.id, data.id), eq(payments.teamId, team.id)))
        .limit(1);

      if (!payment) {
        return { error: 'Payment not found' };
      }

      // Get the invoice
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, payment.invoiceId))
        .limit(1);

      if (!invoice) {
        return { error: 'Invoice not found' };
      }

      // Delete payment and update invoice in transaction
      await db.transaction(async (tx) => {
        // Delete payment
        await tx.delete(payments).where(eq(payments.id, data.id));

        // Calculate new amounts (including adjustment)
        const paymentAmount = new Decimal(payment.amount);
        const adjustmentAmount = new Decimal(payment.adjustmentAmount || '0');
        const totalPaymentAmount = paymentAmount.plus(adjustmentAmount);
        const currentPaid = new Decimal(invoice.amountPaid);
        const newAmountPaid = currentPaid.minus(totalPaymentAmount);
        const totalAmount = new Decimal(invoice.totalAmount);
        const newAmountDue = totalAmount.minus(newAmountPaid);

        // Determine payment status
        let paymentStatus: 'unpaid' | 'partial' | 'paid';
        if (newAmountPaid.greaterThanOrEqualTo(totalAmount)) {
          paymentStatus = 'paid';
        } else if (newAmountPaid.greaterThan(0)) {
          paymentStatus = 'partial';
        } else {
          paymentStatus = 'unpaid';
        }

        // Update invoice status
        let invoiceStatus = invoice.status;
        if (invoiceStatus === 'paid' && paymentStatus !== 'paid') {
          invoiceStatus = 'sent'; // Revert to sent if it was paid
        }

        // Update invoice
        await tx
          .update(invoices)
          .set({
            amountPaid: newAmountPaid.greaterThan(0) ? newAmountPaid.toFixed(2) : '0.00',
            amountDue: newAmountDue.toFixed(2),
            paymentStatus,
            status: invoiceStatus,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, payment.invoiceId));
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.DELETE_PAYMENT}: ${invoice.invoiceNumber} - ${payment.currency} ${payment.amount}`,
        timestamp: new Date(),
      });

      revalidatePath('/invoices');
      revalidatePath(`/invoices/${payment.invoiceId}`);
      return { success: 'Payment deleted successfully' };
    } catch (error) {
      console.error('Error deleting payment:', error);
      return { error: 'Failed to delete payment' };
    }
  }
);
