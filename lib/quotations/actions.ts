'use server';

import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import {
  createQuotationSchema,
  updateQuotationSchema,
  deleteQuotationSchema,
  updateQuotationStatusSchema,
  convertToInvoiceSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import {
  quotations,
  quotationItems,
  invoices,
  invoiceItems,
  activityLogs,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateQuotationNumber } from './numbering';
import { generateInvoiceNumber } from '@/lib/invoices/numbering';
import { calculateLineItem, calculateInvoiceTotals } from '@/lib/invoices/calculations';
import { getGSTClassification } from '@/lib/invoices/gst-classification';

/**
 * Create a new quotation with line items
 */
export const createQuotation = validatedActionWithUser(
  createQuotationSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const quotationNumber = await generateQuotationNumber(team.id, 'QT');

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

      const totals = calculateInvoiceTotals(data.items);

      const [quotation] = await db.transaction(async (tx) => {
        const [newQuotation] = await tx
          .insert(quotations)
          .values({
            teamId: team.id,
            customerId: data.customerId,
            quotationNumber,
            quotationDate: data.quotationDate || new Date(),
            validUntil: data.validUntil || null,
            currency: data.currency,
            subtotal: totals.subtotal,
            totalDiscount: totals.totalDiscount,
            totalTax: totals.totalTax,
            totalAmount: totals.totalAmount,
            status: 'draft',
            notes: data.notes || null,
            customerNotes: data.customerNotes || null,
            termsAndConditions: data.termsAndConditions || null,
            createdBy: user.id,
          })
          .returning();

        await tx.insert(quotationItems).values(
          calculatedItems.map((item) => ({
            ...item,
            quotationId: newQuotation.id,
          }))
        );

        return [newQuotation];
      });

      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `CREATE_QUOTATION: ${quotationNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/quotations');
      return { success: 'Quotation created successfully', quotationId: quotation.id };
    } catch (error) {
      console.error('Error creating quotation:', error);
      return { error: 'Failed to create quotation' };
    }
  }
);

/**
 * Update an existing quotation (only draft or sent)
 */
export const updateQuotation = validatedActionWithUser(
  updateQuotationSchema,
  async (data, _, user) => {
    try {
      const { id, ...updateData } = data;
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [existing] = await db
        .select()
        .from(quotations)
        .where(and(eq(quotations.id, id), eq(quotations.teamId, team.id)))
        .limit(1);

      if (!existing) return { error: 'Quotation not found' };
      if (!['draft', 'sent'].includes(existing.status)) {
        return { error: 'Can only edit draft or sent quotations' };
      }

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

      const totals = calculateInvoiceTotals(updateData.items);

      await db.transaction(async (tx) => {
        await tx
          .update(quotations)
          .set({
            customerId: updateData.customerId,
            quotationDate: updateData.quotationDate || existing.quotationDate,
            validUntil: updateData.validUntil || null,
            currency: updateData.currency,
            subtotal: totals.subtotal,
            totalDiscount: totals.totalDiscount,
            totalTax: totals.totalTax,
            totalAmount: totals.totalAmount,
            notes: updateData.notes || null,
            customerNotes: updateData.customerNotes || null,
            termsAndConditions: updateData.termsAndConditions || null,
            updatedAt: new Date(),
          })
          .where(eq(quotations.id, id));

        // Delete old items and insert new ones
        await tx.delete(quotationItems).where(eq(quotationItems.quotationId, id));
        await tx.insert(quotationItems).values(
          calculatedItems.map((item) => ({
            ...item,
            quotationId: id,
          }))
        );
      });

      revalidatePath('/quotations');
      revalidatePath(`/quotations/${id}`);
      return { success: 'Quotation updated successfully', quotationId: id };
    } catch (error) {
      console.error('Error updating quotation:', error);
      return { error: 'Failed to update quotation' };
    }
  }
);

/**
 * Delete a quotation (admin only)
 */
export const deleteQuotation = validatedActionWithRole(
  deleteQuotationSchema,
  'admin',
  async (data, _) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [existing] = await db
        .select()
        .from(quotations)
        .where(and(eq(quotations.id, data.id), eq(quotations.teamId, team.id)))
        .limit(1);

      if (!existing) return { error: 'Quotation not found' };
      if (existing.status === 'converted') {
        return { error: 'Cannot delete a converted quotation' };
      }

      await db.transaction(async (tx) => {
        await tx.delete(quotationItems).where(eq(quotationItems.quotationId, data.id));
        await tx.delete(quotations).where(eq(quotations.id, data.id));
      });

      revalidatePath('/quotations');
      return { success: 'Quotation deleted successfully' };
    } catch (error) {
      console.error('Error deleting quotation:', error);
      return { error: 'Failed to delete quotation' };
    }
  }
);

/**
 * Update quotation status
 */
export const updateQuotationStatus = validatedActionWithUser(
  updateQuotationStatusSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [existing] = await db
        .select()
        .from(quotations)
        .where(and(eq(quotations.id, data.id), eq(quotations.teamId, team.id)))
        .limit(1);

      if (!existing) return { error: 'Quotation not found' };

      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        draft: ['sent'],
        sent: ['accepted', 'rejected', 'expired'],
        accepted: [],
        rejected: [],
        expired: [],
        converted: [],
      };

      if (!validTransitions[existing.status]?.includes(data.status)) {
        return { error: `Cannot change status from ${existing.status} to ${data.status}` };
      }

      await db
        .update(quotations)
        .set({ status: data.status, updatedAt: new Date() })
        .where(eq(quotations.id, data.id));

      revalidatePath('/quotations');
      revalidatePath(`/quotations/${data.id}`);
      return { success: `Quotation marked as ${data.status}` };
    } catch (error) {
      console.error('Error updating quotation status:', error);
      return { error: 'Failed to update quotation status' };
    }
  }
);

/**
 * Convert quotation to invoice
 */
export const convertToInvoice = validatedActionWithUser(
  convertToInvoiceSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [quotation] = await db
        .select()
        .from(quotations)
        .where(and(eq(quotations.id, data.quotationId), eq(quotations.teamId, team.id)))
        .limit(1);

      if (!quotation) return { error: 'Quotation not found' };
      if (quotation.status !== 'accepted') {
        return { error: 'Only accepted quotations can be converted to invoices' };
      }

      // Get quotation items
      const items = await db
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.quotationId, data.quotationId))
        .orderBy(quotationItems.sortOrder);

      const invoiceNumber = await generateInvoiceNumber(
        team.id,
        team.invoicePrefix || 'INV'
      );

      const [newInvoice] = await db.transaction(async (tx) => {
        // Create invoice
        const [invoice] = await tx
          .insert(invoices)
          .values({
            teamId: team.id,
            customerId: quotation.customerId,
            invoiceNumber,
            invoiceDate: new Date(),
            currency: quotation.currency,
            subtotal: quotation.subtotal,
            totalDiscount: quotation.totalDiscount,
            totalTax: quotation.totalTax,
            totalAmount: quotation.totalAmount,
            amountPaid: '0.00',
            amountDue: quotation.totalAmount,
            status: 'draft',
            paymentStatus: 'unpaid',
            isLocked: false,
            notes: quotation.notes,
            customerNotes: quotation.customerNotes,
            termsAndConditions: quotation.termsAndConditions,
            createdBy: user.id,
          })
          .returning();

        // Copy items
        if (items.length > 0) {
          await tx.insert(invoiceItems).values(
            items.map((item) => ({
              invoiceId: invoice.id,
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              discountPercent: item.discountPercent,
              discountAmount: item.discountAmount,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              isTaxExempt: item.isTaxExempt,
              gstClassification: item.gstClassification,
              itemTotal: item.itemTotal,
              sortOrder: item.sortOrder,
            }))
          );
        }

        // Update quotation status
        await tx
          .update(quotations)
          .set({
            status: 'converted',
            convertedToInvoiceId: invoice.id,
            updatedAt: new Date(),
          })
          .where(eq(quotations.id, data.quotationId));

        return [invoice];
      });

      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `CONVERT_QUOTATION: ${quotation.quotationNumber} → ${invoiceNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/quotations');
      revalidatePath('/invoices');
      return { success: 'Quotation converted to invoice', invoiceId: newInvoice.id };
    } catch (error) {
      console.error('Error converting quotation:', error);
      return { error: 'Failed to convert quotation to invoice' };
    }
  }
);
