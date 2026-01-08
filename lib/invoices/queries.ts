import { db } from '@/lib/db/drizzle';
import {
  invoices,
  invoiceItems,
  customers,
  payments,
  products,
} from '@/lib/db/schema';
import { eq, and, ilike, desc, or, gte, lte, sql } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all invoices for the current team
 * Optionally filter by search term, status, customer, date range
 */
export async function getInvoices(params?: {
  searchTerm?: string;
  status?: string;
  customerId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const team = await getTeamForUser();
  if (!team) return [];

  let conditions = [eq(invoices.teamId, team.id)];

  // Filter by search term (invoice number or customer name)
  if (params?.searchTerm) {
    const searchPattern = `%${params.searchTerm}%`;
    // We'll need to join with customers for name search
    const invoicesWithCustomers = await db
      .select({
        invoice: invoices,
        customer: customers,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(
        and(
          eq(invoices.teamId, team.id),
          or(
            ilike(invoices.invoiceNumber, searchPattern),
            ilike(customers.name, searchPattern)
          )
        )
      )
      .orderBy(desc(invoices.invoiceDate));

    return invoicesWithCustomers;
  }

  // Filter by status
  if (params?.status) {
    conditions.push(eq(invoices.status, params.status as any));
  }

  // Filter by customer
  if (params?.customerId) {
    conditions.push(eq(invoices.customerId, params.customerId));
  }

  // Filter by date range
  if (params?.startDate) {
    conditions.push(gte(invoices.invoiceDate, params.startDate));
  }
  if (params?.endDate) {
    conditions.push(lte(invoices.invoiceDate, params.endDate));
  }

  const result = await db
    .select({
      invoice: invoices,
      customer: customers,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(invoices.invoiceDate));

  return result;
}

/**
 * Get a single invoice with all details (customer, items, payments)
 */
export async function getInvoiceWithDetails(id: number) {
  const team = await getTeamForUser();
  if (!team) return null;

  // Get the invoice with customer
  const [invoiceData] = await db
    .select({
      invoice: invoices,
      customer: customers,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(eq(invoices.id, id), eq(invoices.teamId, team.id)))
    .limit(1);

  if (!invoiceData) return null;

  // Get all invoice items
  const items = await db
    .select({
      item: invoiceItems,
      product: products,
    })
    .from(invoiceItems)
    .leftJoin(products, eq(invoiceItems.productId, products.id))
    .where(eq(invoiceItems.invoiceId, id))
    .orderBy(invoiceItems.sortOrder);

  // Get all payments
  const invoicePayments = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, id))
    .orderBy(desc(payments.paymentDate));

  // Get all adjustments
  const { invoiceAdjustments } = await import('@/lib/db/schema');
  const adjustments = await db
    .select()
    .from(invoiceAdjustments)
    .where(eq(invoiceAdjustments.invoiceId, id))
    .orderBy(desc(invoiceAdjustments.adjustmentDate));

  return {
    ...invoiceData.invoice,
    customer: invoiceData.customer,
    items: items.map((i) => ({
      ...i.item,
      product: i.product,
    })),
    payments: invoicePayments,
    adjustments: adjustments,
  };
}

/**
 * Get a single invoice by ID (basic, without related data)
 */
export async function getInvoiceById(id: number) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.teamId, team.id)))
    .limit(1);

  return invoice || null;
}

/**
 * Get overdue invoices for the current team
 * Invoices are overdue if dueDate < now() AND paymentStatus != 'paid'
 */
export async function getOverdueInvoices() {
  const team = await getTeamForUser();
  if (!team) return [];

  const now = new Date();

  const result = await db
    .select({
      invoice: invoices,
      customer: customers,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(
      and(
        eq(invoices.teamId, team.id),
        lte(invoices.dueDate, now),
        sql`${invoices.paymentStatus} != 'paid'`
      )
    )
    .orderBy(invoices.dueDate);

  return result;
}

/**
 * Get recent invoices (last 10)
 */
export async function getRecentInvoices() {
  const team = await getTeamForUser();
  if (!team) return [];

  const result = await db
    .select({
      invoice: invoices,
      customer: customers,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.teamId, team.id))
    .orderBy(desc(invoices.createdAt))
    .limit(10);

  return result;
}

/**
 * Get invoice count by status for dashboard
 */
export async function getInvoiceCountByStatus() {
  const team = await getTeamForUser();
  if (!team) return {};

  const result = await db
    .select({
      status: invoices.status,
      count: sql<number>`count(*)::int`,
    })
    .from(invoices)
    .where(eq(invoices.teamId, team.id))
    .groupBy(invoices.status);

  return result.reduce(
    (acc, row) => {
      acc[row.status] = row.count;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Get total revenue (sum of paid invoices)
 */
export async function getTotalRevenue(params?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const team = await getTeamForUser();
  if (!team) return '0.00';

  let conditions = [
    eq(invoices.teamId, team.id),
    eq(invoices.paymentStatus, 'paid' as any),
  ];

  if (params?.startDate) {
    conditions.push(gte(invoices.invoiceDate, params.startDate));
  }
  if (params?.endDate) {
    conditions.push(lte(invoices.invoiceDate, params.endDate));
  }

  const [result] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
    })
    .from(invoices)
    .where(and(...conditions));

  return result?.total || '0.00';
}

/**
 * Get total outstanding (sum of unpaid + partial invoices)
 */
export async function getTotalOutstanding() {
  const team = await getTeamForUser();
  if (!team) return '0.00';

  const [result] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${invoices.amountDue}), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, team.id),
        sql`${invoices.paymentStatus} != 'paid'`
      )
    );

  return result?.total || '0.00';
}
