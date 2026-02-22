'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import { createContractSchema, updateContractSchema } from './validation';
import { db } from '@/lib/db/drizzle';
import {
  contracts,
  contractMilestones,
  contractBillingSchedule,
  invoices,
  invoiceItems,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateContractNumber } from './numbering';
import { generateInvoiceNumber } from '@/lib/invoices/numbering';
import { calculateLineItem, calculateInvoiceTotals } from '@/lib/invoices/calculations';
import { getGSTClassification } from '@/lib/invoices/gst-classification';
import { z } from 'zod';

/**
 * Create a new contract with optional milestones/billing schedule
 */
export const createContract = validatedActionWithUser(
  createContractSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const contractNumber = await generateContractNumber(team.id);

      // Validate milestones don't exceed total value
      if (data.milestones && data.milestones.length > 0) {
        const totalMilestoneAmount = data.milestones.reduce((sum, m) => sum + m.amount, 0);
        if (totalMilestoneAmount > data.totalValue * 1.001) { // small tolerance for rounding
          return { error: `Milestones total (${totalMilestoneAmount}) exceeds contract value (${data.totalValue})` };
        }
      }

      // Validate billing schedule doesn't exceed total value
      if (data.billingSchedule && data.billingSchedule.length > 0) {
        const totalBillingAmount = data.billingSchedule.reduce((sum, b) => sum + b.amount, 0);
        if (totalBillingAmount > data.totalValue * 1.001) {
          return { error: `Billing schedule total (${totalBillingAmount}) exceeds contract value (${data.totalValue})` };
        }
      }

      const [contract] = await db.transaction(async (tx) => {
        // Create the contract
        const [newContract] = await tx
          .insert(contracts)
          .values({
            teamId: team.id,
            customerId: data.customerId,
            contractNumber,
            type: data.type,
            name: data.name,
            description: data.description || null,
            totalValue: data.totalValue.toString(),
            currency: data.currency,
            gstRate: (data.gstRate ?? 0).toString(),
            isGstInclusive: data.isGstInclusive ?? true,
            totalInvoiced: '0',
            totalPaid: '0',
            remainingValue: data.totalValue.toString(),
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            billingFrequency: data.billingFrequency || null,
            status: 'active',
            notes: data.notes || null,
            terms: data.terms || null,
            createdBy: user.id,
          })
          .returning();

        // Create milestones if provided
        if (data.milestones && data.milestones.length > 0) {
          await tx.insert(contractMilestones).values(
            data.milestones.map((m, index) => ({
              contractId: newContract.id,
              name: m.name,
              description: m.description || null,
              percentage: m.percentage?.toString() || null,
              amount: m.amount.toString(),
              dueDate: m.dueDate ? new Date(m.dueDate) : null,
              status: 'pending' as const,
              sortOrder: index,
            }))
          );
        }

        // Create billing schedule if provided
        if (data.billingSchedule && data.billingSchedule.length > 0) {
          await tx.insert(contractBillingSchedule).values(
            data.billingSchedule.map((b, index) => ({
              contractId: newContract.id,
              periodLabel: b.periodLabel || null,
              periodStart: new Date(b.periodStart),
              periodEnd: new Date(b.periodEnd),
              amount: b.amount.toString(),
              dueDate: b.dueDate ? new Date(b.dueDate) : null,
              status: 'pending' as const,
              sortOrder: index,
            }))
          );

          // Set next billing date
          const firstPending = data.billingSchedule[0];
          if (firstPending?.dueDate) {
            await tx
              .update(contracts)
              .set({ nextBillingDate: new Date(firstPending.dueDate) })
              .where(eq(contracts.id, newContract.id));
          }
        }

        return [newContract];
      });

      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.CREATE_CONTRACT}: ${contractNumber} - ${data.name}`,
        timestamp: new Date(),
      });

      revalidatePath('/contracts');
      return { success: 'Contract created successfully', contractId: contract.id };
    } catch (error) {
      console.error('Error creating contract:', error);
      return { error: 'Failed to create contract' };
    }
  }
);

/**
 * Update a contract (only if not completed/cancelled)
 */
export const updateContract = validatedActionWithUser(
  updateContractSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [existing] = await db
        .select()
        .from(contracts)
        .where(and(eq(contracts.id, data.id), eq(contracts.teamId, team.id)));

      if (!existing) return { error: 'Contract not found' };
      if (existing.status === 'completed' || existing.status === 'cancelled') {
        return { error: 'Cannot edit a completed or cancelled contract' };
      }

      await db
        .update(contracts)
        .set({
          name: data.name ?? existing.name,
          description: data.description !== undefined ? (data.description || null) : existing.description,
          totalValue: data.totalValue?.toString() ?? existing.totalValue,
          currency: data.currency ?? existing.currency,
          gstRate: data.gstRate !== undefined ? data.gstRate.toString() : existing.gstRate,
          isGstInclusive: data.isGstInclusive !== undefined ? data.isGstInclusive : existing.isGstInclusive,
          remainingValue: data.totalValue
            ? (data.totalValue - parseFloat(existing.totalInvoiced)).toString()
            : existing.remainingValue,
          startDate: data.startDate ? new Date(data.startDate) : existing.startDate,
          endDate: data.endDate ? new Date(data.endDate) : existing.endDate,
          billingFrequency: data.billingFrequency ?? existing.billingFrequency,
          notes: data.notes !== undefined ? (data.notes || null) : existing.notes,
          terms: data.terms !== undefined ? (data.terms || null) : existing.terms,
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, data.id));

      // Update milestones if provided
      if (data.milestones !== undefined) {
        // Delete existing non-invoiced milestones
        const existingMilestones = await db
          .select()
          .from(contractMilestones)
          .where(eq(contractMilestones.contractId, data.id));

        for (const m of existingMilestones) {
          if (m.status === 'pending') {
            await db.delete(contractMilestones).where(eq(contractMilestones.id, m.id));
          }
        }

        // Insert new milestones
        if (data.milestones.length > 0) {
          const invoicedCount = existingMilestones.filter(m => m.status !== 'pending').length;
          await db.insert(contractMilestones).values(
            data.milestones.map((m, index) => ({
              contractId: data.id,
              name: m.name,
              description: m.description || null,
              percentage: m.percentage?.toString() || null,
              amount: m.amount.toString(),
              dueDate: m.dueDate ? new Date(m.dueDate) : null,
              status: 'pending' as const,
              sortOrder: invoicedCount + index,
            }))
          );
        }
      }

      // Update billing schedule if provided
      if (data.billingSchedule !== undefined) {
        const existingEntries = await db
          .select()
          .from(contractBillingSchedule)
          .where(eq(contractBillingSchedule.contractId, data.id));

        for (const b of existingEntries) {
          if (b.status === 'pending') {
            await db.delete(contractBillingSchedule).where(eq(contractBillingSchedule.id, b.id));
          }
        }

        if (data.billingSchedule.length > 0) {
          const invoicedCount = existingEntries.filter(b => b.status !== 'pending').length;
          await db.insert(contractBillingSchedule).values(
            data.billingSchedule.map((b, index) => ({
              contractId: data.id,
              periodLabel: b.periodLabel || null,
              periodStart: new Date(b.periodStart),
              periodEnd: new Date(b.periodEnd),
              amount: b.amount.toString(),
              dueDate: b.dueDate ? new Date(b.dueDate) : null,
              status: 'pending' as const,
              sortOrder: invoicedCount + index,
            }))
          );
        }
      }

      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.UPDATE_CONTRACT}: ${existing.contractNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/contracts');
      revalidatePath(`/contracts/${data.id}`);
      return { success: 'Contract updated successfully' };
    } catch (error) {
      console.error('Error updating contract:', error);
      return { error: 'Failed to update contract' };
    }
  }
);

/**
 * Create an invoice from a contract (milestone, billing schedule, or ad-hoc)
 */
export async function createInvoiceFromContract(
  input: {
    contractId: string;
    milestoneId?: string;
    billingScheduleId?: string;
    percentage?: number;
    amount?: number;
    description?: string;
    // Invoice fields
    invoiceDate?: Date;
    dueDate?: Date;
    currency?: string;
    taxRate?: number;
    isTaxExempt?: boolean;
    paymentTerms?: string;
    customerNotes?: string;
    notes?: string;
  },
  userId: string
) {
  const team = await getTeamForUser();
  if (!team) return { error: 'Team not found' };

  // Get contract
  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, input.contractId), eq(contracts.teamId, team.id)));

  if (!contract) return { error: 'Contract not found' };
  if (contract.status !== 'active') return { error: 'Contract is not active' };

  let invoiceAmount: number;
  let lineDescription: string;

  if (input.milestoneId) {
    // Invoice from milestone
    const [milestone] = await db
      .select()
      .from(contractMilestones)
      .where(
        and(
          eq(contractMilestones.id, input.milestoneId),
          eq(contractMilestones.contractId, input.contractId)
        )
      );
    if (!milestone) return { error: 'Milestone not found' };
    if (milestone.status !== 'pending') return { error: 'Milestone already invoiced' };

    invoiceAmount = parseFloat(milestone.amount);
    lineDescription = `${contract.name} - ${milestone.name}`;
    if (milestone.percentage) {
      lineDescription += ` (${parseFloat(milestone.percentage)}%)`;
    }
  } else if (input.billingScheduleId) {
    // Invoice from billing schedule
    const [entry] = await db
      .select()
      .from(contractBillingSchedule)
      .where(
        and(
          eq(contractBillingSchedule.id, input.billingScheduleId),
          eq(contractBillingSchedule.contractId, input.contractId)
        )
      );
    if (!entry) return { error: 'Billing schedule entry not found' };
    if (entry.status !== 'pending') return { error: 'Billing period already invoiced' };

    invoiceAmount = parseFloat(entry.amount);
    lineDescription = `${contract.name} - ${entry.periodLabel || 'Maintenance Period'}`;
  } else if (input.percentage) {
    // Ad-hoc percentage
    invoiceAmount = (parseFloat(contract.totalValue) * input.percentage) / 100;
    lineDescription = input.description || `${contract.name} - ${input.percentage}% billing`;
  } else if (input.amount) {
    // Ad-hoc fixed amount
    invoiceAmount = input.amount;
    lineDescription = input.description || `${contract.name} - Progress billing`;
  } else {
    return { error: 'Please specify a milestone, billing period, percentage, or amount' };
  }

  // Validate against remaining value
  const remaining = parseFloat(contract.remainingValue);
  if (invoiceAmount > remaining * 1.001) {
    return { error: `Invoice amount (${invoiceAmount.toFixed(2)}) exceeds remaining contract value (${remaining.toFixed(2)})` };
  }

  // Contract amounts are GST-inclusive
  // Reverse-calculate: subtotal = inclusiveAmount / (1 + gstRate/100)
  const taxRate = input.taxRate ?? parseFloat(team.defaultGstRate || '0');
  const isTaxExempt = input.isTaxExempt ?? false;

  const effectiveTaxRate = isTaxExempt ? 0 : taxRate;
  const subtotalAmount = effectiveTaxRate > 0
    ? invoiceAmount / (1 + effectiveTaxRate / 100)
    : invoiceAmount;
  const taxAmount = invoiceAmount - subtotalAmount;

  const gstClassification = getGSTClassification(taxRate, isTaxExempt);

  try {
    const invoiceNumber = await generateInvoiceNumber(team.id, team.invoicePrefix || 'INV');

    const [invoice] = await db.transaction(async (tx) => {
      // Create invoice
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          teamId: team.id,
          customerId: contract.customerId,
          contractId: contract.id,
          contractMilestoneId: input.milestoneId || null,
          contractBillingScheduleId: input.billingScheduleId || null,
          invoiceNumber,
          invoiceDate: input.invoiceDate || new Date(),
          dueDate: input.dueDate || null,
          currency: input.currency || contract.currency,
          subtotal: subtotalAmount.toFixed(2),
          totalDiscount: '0.00',
          totalTax: taxAmount.toFixed(2),
          totalAmount: invoiceAmount.toFixed(2), // GST-inclusive total = contract amount
          amountPaid: '0.00',
          amountDue: invoiceAmount.toFixed(2),
          status: 'draft',
          paymentStatus: 'unpaid',
          isLocked: false,
          paymentTerms: input.paymentTerms || null,
          notes: input.notes || null,
          customerNotes: input.customerNotes || null,
          createdBy: userId,
        })
        .returning();

      // Create line item with GST-exclusive unit price
      await tx.insert(invoiceItems).values({
        invoiceId: newInvoice.id,
        description: lineDescription,
        quantity: '1',
        unit: 'service',
        unitPrice: subtotalAmount.toFixed(2),
        lineTotal: subtotalAmount.toFixed(2),
        discountPercent: '0',
        discountAmount: '0.00',
        taxRate: taxRate.toString(),
        taxAmount: taxAmount.toFixed(2),
        isTaxExempt,
        gstClassification,
        itemTotal: invoiceAmount.toFixed(2),
        sortOrder: 0,
      });

      // Update milestone/billing schedule status
      if (input.milestoneId) {
        await tx
          .update(contractMilestones)
          .set({ status: 'invoiced', invoiceId: newInvoice.id, updatedAt: new Date() })
          .where(eq(contractMilestones.id, input.milestoneId));
      }

      if (input.billingScheduleId) {
        await tx
          .update(contractBillingSchedule)
          .set({ status: 'invoiced', invoiceId: newInvoice.id, updatedAt: new Date() })
          .where(eq(contractBillingSchedule.id, input.billingScheduleId));
      }

      // Update contract totals
      const newTotalInvoiced = parseFloat(contract.totalInvoiced) + invoiceAmount;
      const newRemainingValue = parseFloat(contract.totalValue) - newTotalInvoiced;

      await tx
        .update(contracts)
        .set({
          totalInvoiced: newTotalInvoiced.toFixed(2),
          remainingValue: newRemainingValue.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, contract.id));

      return [newInvoice];
    });

    await db.insert(activityLogs).values({
      teamId: team.id,
      userId,
      action: `${ActivityType.CREATE_INVOICE}: ${invoiceNumber} from contract ${contract.contractNumber}`,
      timestamp: new Date(),
    });

    revalidatePath('/contracts');
    revalidatePath(`/contracts/${contract.id}`);
    revalidatePath('/invoices');

    return { success: 'Invoice created from contract', invoiceId: invoice.id };
  } catch (error) {
    console.error('Error creating invoice from contract:', error);
    return { error: 'Failed to create invoice from contract' };
  }
}

/**
 * Mark contract as completed
 */
export async function completeContract(contractId: string, userId: string) {
  const team = await getTeamForUser();
  if (!team) return { error: 'Team not found' };

  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, contractId), eq(contracts.teamId, team.id)));

  if (!contract) return { error: 'Contract not found' };

  await db
    .update(contracts)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(eq(contracts.id, contractId));

  await db.insert(activityLogs).values({
    teamId: team.id,
    userId,
    action: `${ActivityType.COMPLETE_CONTRACT}: ${contract.contractNumber}`,
    timestamp: new Date(),
  });

  revalidatePath('/contracts');
  revalidatePath(`/contracts/${contractId}`);
  return { success: 'Contract marked as completed' };
}

/**
 * Cancel a contract
 */
export async function cancelContract(contractId: string, userId: string) {
  const team = await getTeamForUser();
  if (!team) return { error: 'Team not found' };

  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, contractId), eq(contracts.teamId, team.id)));

  if (!contract) return { error: 'Contract not found' };

  await db
    .update(contracts)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(contracts.id, contractId));

  await db.insert(activityLogs).values({
    teamId: team.id,
    userId,
    action: `${ActivityType.CANCEL_CONTRACT}: ${contract.contractNumber}`,
    timestamp: new Date(),
  });

  revalidatePath('/contracts');
  revalidatePath(`/contracts/${contractId}`);
  return { success: 'Contract cancelled' };
}

/**
 * Delete a contract (only if draft and no invoices linked)
 */
export async function deleteContract(contractId: string, userId: string) {
  const team = await getTeamForUser();
  if (!team) return { error: 'Team not found' };

  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, contractId), eq(contracts.teamId, team.id)));

  if (!contract) return { error: 'Contract not found' };
  if (contract.status !== 'draft' && contract.status !== 'cancelled') {
    return { error: 'Only draft or cancelled contracts can be deleted' };
  }

  // Check for linked invoices
  const linkedInvoices = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.contractId, contractId))
    .limit(1);

  if (linkedInvoices.length > 0) {
    return { error: 'Cannot delete contract with linked invoices' };
  }

  // Cascade will handle milestones and billing schedule
  await db.delete(contracts).where(eq(contracts.id, contractId));

  await db.insert(activityLogs).values({
    teamId: team.id,
    userId,
    action: `${ActivityType.DELETE_CONTRACT}: ${contract.contractNumber}`,
    timestamp: new Date(),
  });

  revalidatePath('/contracts');
  return { success: 'Contract deleted' };
}
