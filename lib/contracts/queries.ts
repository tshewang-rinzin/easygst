'use server';

import { db } from '@/lib/db/drizzle';
import {
  contracts,
  contractMilestones,
  contractBillingSchedule,
  customers,
  invoices,
} from '@/lib/db/schema';
import { eq, and, desc, or, ilike, sql } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all contracts for the current team with optional filters
 */
export async function getContracts(options?: {
  search?: string;
  type?: 'project' | 'amc';
  status?: string;
  customerId?: string;
}) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [eq(contracts.teamId, team.id)];

  if (options?.type) {
    conditions.push(eq(contracts.type, options.type));
  }

  if (options?.status) {
    conditions.push(eq(contracts.status, options.status));
  }

  if (options?.customerId) {
    conditions.push(eq(contracts.customerId, options.customerId));
  }

  if (options?.search) {
    const pattern = `%${options.search}%`;
    conditions.push(
      or(
        ilike(contracts.name, pattern),
        ilike(contracts.contractNumber, pattern)
      )!
    );
  }

  const results = await db
    .select({
      contract: contracts,
      customerName: customers.name,
    })
    .from(contracts)
    .leftJoin(customers, eq(contracts.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(contracts.createdAt));

  return results;
}

/**
 * Get a single contract with all details (milestones, billing schedule, invoices)
 */
export async function getContractWithDetails(contractId: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [contract] = await db
    .select({
      contract: contracts,
      customerName: customers.name,
      customerEmail: customers.email,
      customerPhone: customers.phone,
    })
    .from(contracts)
    .leftJoin(customers, eq(contracts.customerId, customers.id))
    .where(and(eq(contracts.id, contractId), eq(contracts.teamId, team.id)));

  if (!contract) return null;

  // Get milestones
  const milestones = await db
    .select()
    .from(contractMilestones)
    .where(eq(contractMilestones.contractId, contractId))
    .orderBy(contractMilestones.sortOrder);

  // Get billing schedule
  const billingEntries = await db
    .select()
    .from(contractBillingSchedule)
    .where(eq(contractBillingSchedule.contractId, contractId))
    .orderBy(contractBillingSchedule.sortOrder);

  // Get linked invoices
  const linkedInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      totalAmount: invoices.totalAmount,
      amountPaid: invoices.amountPaid,
      amountDue: invoices.amountDue,
      status: invoices.status,
      paymentStatus: invoices.paymentStatus,
    })
    .from(invoices)
    .where(and(eq(invoices.contractId, contractId), eq(invoices.teamId, team.id)))
    .orderBy(desc(invoices.invoiceDate));

  return {
    ...contract,
    milestones,
    billingEntries,
    linkedInvoices,
  };
}

/**
 * Get contract by ID (simple, no joins)
 */
export async function getContractById(contractId: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, contractId), eq(contracts.teamId, team.id)));

  return contract || null;
}

/**
 * Get contracts for a specific customer
 */
export async function getContractsForCustomer(customerId: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  return db
    .select()
    .from(contracts)
    .where(
      and(
        eq(contracts.teamId, team.id),
        eq(contracts.customerId, customerId),
        or(eq(contracts.status, 'active'), eq(contracts.status, 'draft'))
      )
    )
    .orderBy(desc(contracts.createdAt));
}

/**
 * Get upcoming billing entries (for dashboard widget)
 */
export async function getUpcomingBillings(daysAhead: number = 30) {
  const team = await getTeamForUser();
  if (!team) return [];

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return db
    .select({
      billing: contractBillingSchedule,
      contractName: contracts.name,
      contractNumber: contracts.contractNumber,
      customerName: customers.name,
    })
    .from(contractBillingSchedule)
    .innerJoin(contracts, eq(contractBillingSchedule.contractId, contracts.id))
    .leftJoin(customers, eq(contracts.customerId, customers.id))
    .where(
      and(
        eq(contracts.teamId, team.id),
        eq(contractBillingSchedule.status, 'pending'),
        sql`${contractBillingSchedule.dueDate} >= ${now}`,
        sql`${contractBillingSchedule.dueDate} <= ${futureDate}`
      )
    )
    .orderBy(contractBillingSchedule.dueDate);
}
