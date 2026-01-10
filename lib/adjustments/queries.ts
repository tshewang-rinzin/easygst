import { db } from '@/lib/db/drizzle';
import { invoiceAdjustments, invoices, customers } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';

/**
 * Get all adjustments with invoice and customer details
 */
export async function getAdjustments() {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select({
      adjustment: invoiceAdjustments,
      invoice: invoices,
      customer: customers,
    })
    .from(invoiceAdjustments)
    .leftJoin(invoices, eq(invoiceAdjustments.invoiceId, invoices.id))
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoiceAdjustments.teamId, team.id))
    .orderBy(desc(invoiceAdjustments.adjustmentDate));

  return results;
}

/**
 * Get adjustments for a specific invoice
 */
export async function getInvoiceAdjustments(invoiceId: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select()
    .from(invoiceAdjustments)
    .where(eq(invoiceAdjustments.invoiceId, invoiceId))
    .orderBy(desc(invoiceAdjustments.adjustmentDate));

  return results;
}

/**
 * Get recent adjustments (last 10)
 */
export async function getRecentAdjustments() {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select({
      adjustment: invoiceAdjustments,
      invoice: invoices,
      customer: customers,
    })
    .from(invoiceAdjustments)
    .leftJoin(invoices, eq(invoiceAdjustments.invoiceId, invoices.id))
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoiceAdjustments.teamId, team.id))
    .orderBy(desc(invoiceAdjustments.adjustmentDate))
    .limit(10);

  return results;
}

/**
 * Get adjustment by ID
 */
export async function getAdjustmentById(id: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [result] = await db
    .select({
      adjustment: invoiceAdjustments,
      invoice: invoices,
      customer: customers,
    })
    .from(invoiceAdjustments)
    .leftJoin(invoices, eq(invoiceAdjustments.invoiceId, invoices.id))
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoiceAdjustments.id, id))
    .limit(1);

  return result || null;
}
