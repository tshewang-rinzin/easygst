'use server';

import { db } from '@/lib/db/drizzle';
import {
  customerSubscriptions,
  customerSubscriptionInvoices,
  customers,
  products,
  invoices,
} from '@/lib/db/schema';
import { eq, and, desc, or, ilike, sql, lte } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all subscriptions for the current team with optional filters
 */
export async function getSubscriptions(options?: {
  search?: string;
  status?: string;
}) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions: any[] = [eq(customerSubscriptions.teamId, team.id)];

  if (options?.status) {
    conditions.push(eq(customerSubscriptions.status, options.status));
  }

  if (options?.search) {
    const pattern = `%${options.search}%`;
    conditions.push(
      or(
        ilike(customerSubscriptions.subscriptionNumber, pattern),
        ilike(customers.name, pattern)
      )!
    );
  }

  const results = await db
    .select({
      subscription: customerSubscriptions,
      customerName: customers.name,
      productName: products.name,
    })
    .from(customerSubscriptions)
    .leftJoin(customers, eq(customerSubscriptions.customerId, customers.id))
    .leftJoin(products, eq(customerSubscriptions.productId, products.id))
    .where(and(...conditions))
    .orderBy(desc(customerSubscriptions.createdAt));

  return results;
}

/**
 * Get a single subscription with details
 */
export async function getSubscriptionById(subscriptionId: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [result] = await db
    .select({
      subscription: customerSubscriptions,
      customerName: customers.name,
      customerEmail: customers.email,
      customerPhone: customers.phone,
      productName: products.name,
    })
    .from(customerSubscriptions)
    .leftJoin(customers, eq(customerSubscriptions.customerId, customers.id))
    .leftJoin(products, eq(customerSubscriptions.productId, products.id))
    .where(
      and(
        eq(customerSubscriptions.id, subscriptionId),
        eq(customerSubscriptions.teamId, team.id)
      )
    )
    .limit(1);

  if (!result) return null;

  // Get linked invoices
  const linkedInvoices = await db
    .select({
      link: customerSubscriptionInvoices,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      invoiceId: invoices.id,
    })
    .from(customerSubscriptionInvoices)
    .leftJoin(invoices, eq(customerSubscriptionInvoices.invoiceId, invoices.id))
    .where(eq(customerSubscriptionInvoices.subscriptionId, subscriptionId))
    .orderBy(desc(customerSubscriptionInvoices.createdAt));

  return { ...result, linkedInvoices };
}

/**
 * Get due subscriptions for auto-invoicing
 */
export async function getDueSubscriptions() {
  const team = await getTeamForUser();
  if (!team) return [];

  const now = new Date();

  const results = await db
    .select({
      subscription: customerSubscriptions,
      customerName: customers.name,
      productName: products.name,
    })
    .from(customerSubscriptions)
    .leftJoin(customers, eq(customerSubscriptions.customerId, customers.id))
    .leftJoin(products, eq(customerSubscriptions.productId, products.id))
    .where(
      and(
        eq(customerSubscriptions.teamId, team.id),
        eq(customerSubscriptions.status, 'active'),
        eq(customerSubscriptions.autoInvoice, true),
        lte(customerSubscriptions.nextBillingDate, now)
      )
    )
    .orderBy(customerSubscriptions.nextBillingDate);

  return results;
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats() {
  const team = await getTeamForUser();
  if (!team) return { active: 0, paused: 0, cancelled: 0, expired: 0, upcomingRenewals: 0 };

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const statusCounts = await db
    .select({
      status: customerSubscriptions.status,
      count: sql<number>`count(*)::int`,
    })
    .from(customerSubscriptions)
    .where(eq(customerSubscriptions.teamId, team.id))
    .groupBy(customerSubscriptions.status);

  const [upcoming] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(customerSubscriptions)
    .where(
      and(
        eq(customerSubscriptions.teamId, team.id),
        eq(customerSubscriptions.status, 'active'),
        lte(customerSubscriptions.nextBillingDate, nextWeek)
      )
    );

  const stats: Record<string, number> = { active: 0, paused: 0, cancelled: 0, expired: 0 };
  for (const row of statusCounts) {
    stats[row.status] = row.count;
  }

  return {
    ...stats,
    upcomingRenewals: upcoming?.count || 0,
  };
}
