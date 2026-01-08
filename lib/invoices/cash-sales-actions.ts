'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import { invoiceSchema } from './validation';
import { db } from '@/lib/db/drizzle';
import {
  invoices,
  invoiceItems,
  payments,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { generateInvoiceNumber } from './numbering';
import { calculateLineItem, calculateInvoiceTotals } from './calculations';
import { getGSTClassification } from './gst-classification';
import Decimal from 'decimal.js';
import { z } from 'zod';

// Cash sale schema - includes payment method
const cashSaleSchema = invoiceSchema.extend({
  paymentMethod: z.enum(['cash', 'bank_transfer', 'online', 'cheque']).default('cash'),
  transactionId: z.string().max(200).optional().or(z.literal('')),
  receiptNumber: z.string().max(50).optional().or(z.literal('')),
});

/**
 * Create a cash sale (invoice + immediate payment in one transaction)
 */
export const createCashSale = validatedActionWithUser(
  cashSaleSchema,
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

      // Create invoice, items, and payment in a single transaction
      const [invoice] = await db.transaction(async (tx) => {
        // Create the invoice with paid status
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            teamId: team.id,
            customerId: data.customerId,
            invoiceNumber,
            invoiceDate: data.invoiceDate,
            dueDate: null, // No due date for cash sales
            currency: data.currency,
            subtotal: totals.subtotal,
            totalDiscount: totals.totalDiscount,
            totalTax: totals.totalTax,
            totalAmount: totals.totalAmount,
            amountPaid: totals.totalAmount, // Fully paid immediately
            amountDue: '0.00', // No outstanding
            status: 'paid', // Mark as paid immediately
            paymentStatus: 'paid',
            isLocked: true, // Lock immediately since payment is received
            lockedAt: new Date(),
            lockedBy: user.id,
            paymentTerms: 'Cash Sale - Payment Received', // Indicate cash sale
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

        // Create payment record
        await tx.insert(payments).values({
          teamId: team.id,
          invoiceId: newInvoice.id,
          amount: totals.totalAmount,
          currency: data.currency,
          paymentDate: data.invoiceDate, // Payment date = invoice date
          paymentMethod: data.paymentMethod,
          transactionId: data.transactionId || null,
          receiptNumber: data.receiptNumber || invoiceNumber, // Use invoice number as receipt if not provided
          notes: 'Cash Sale - Immediate Payment',
          createdBy: user.id,
        });

        return [newInvoice];
      });

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.CREATE_INVOICE}: Cash Sale ${invoiceNumber} - ${data.currency} ${totals.totalAmount}`,
        timestamp: new Date(),
      });

      revalidatePath('/sales/cash-sales');
      revalidatePath('/dashboard');
      return {
        success: 'Cash sale recorded successfully',
        invoiceId: invoice.id,
      };
    } catch (error) {
      console.error('Error creating cash sale:', error);
      return { error: 'Failed to create cash sale' };
    }
  }
);
