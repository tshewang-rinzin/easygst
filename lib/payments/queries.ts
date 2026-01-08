import { db } from '@/lib/db/drizzle';
import { payments, invoices, customers } from '@/lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all payments for the current team with invoice and customer details
 */
export async function getPayments(params?: {
  startDate?: Date;
  endDate?: Date;
  invoiceId?: number;
}) {
  const team = await getTeamForUser();
  if (!team) return [];

  let conditions = [eq(payments.teamId, team.id)];

  // Filter by date range
  if (params?.startDate) {
    conditions.push(gte(payments.paymentDate, params.startDate));
  }
  if (params?.endDate) {
    conditions.push(lte(payments.paymentDate, params.endDate));
  }

  // Filter by invoice
  if (params?.invoiceId) {
    conditions.push(eq(payments.invoiceId, params.invoiceId));
  }

  const result = await db
    .select({
      payment: payments,
      invoice: invoices,
      customer: customers,
    })
    .from(payments)
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(payments.paymentDate));

  return result;
}

/**
 * Get recent payments (last 10)
 */
export async function getRecentPayments() {
  const team = await getTeamForUser();
  if (!team) return [];

  const result = await db
    .select({
      payment: payments,
      invoice: invoices,
      customer: customers,
    })
    .from(payments)
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(payments.teamId, team.id))
    .orderBy(desc(payments.createdAt))
    .limit(10);

  return result;
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: number) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [result] = await db
    .select({
      payment: payments,
      invoice: invoices,
      customer: customers,
    })
    .from(payments)
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(eq(payments.id, id), eq(payments.teamId, team.id)))
    .limit(1);

  return result || null;
}
