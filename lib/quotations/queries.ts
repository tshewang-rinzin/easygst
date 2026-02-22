import { db } from '@/lib/db/drizzle';
import {
  quotations,
  quotationItems,
  customers,
  products,
} from '@/lib/db/schema';
import { eq, and, ilike, desc, or, sql } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all quotations for the current team
 */
export async function getQuotations(params?: {
  searchTerm?: string;
  status?: string;
}) {
  const team = await getTeamForUser();
  if (!team) return [];

  if (params?.searchTerm) {
    const searchPattern = `%${params.searchTerm}%`;
    return db
      .select({
        quotation: quotations,
        customer: customers,
      })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .where(
        and(
          eq(quotations.teamId, team.id),
          or(
            ilike(quotations.quotationNumber, searchPattern),
            ilike(customers.name, searchPattern)
          )
        )
      )
      .orderBy(desc(quotations.quotationDate));
  }

  const conditions: any[] = [eq(quotations.teamId, team.id)];
  if (params?.status) {
    conditions.push(eq(quotations.status, params.status as any));
  }

  return db
    .select({
      quotation: quotations,
      customer: customers,
    })
    .from(quotations)
    .leftJoin(customers, eq(quotations.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(quotations.quotationDate));
}

/**
 * Get a single quotation with all details
 */
export async function getQuotationById(id: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [quotationData] = await db
    .select({
      quotation: quotations,
      customer: customers,
    })
    .from(quotations)
    .leftJoin(customers, eq(quotations.customerId, customers.id))
    .where(and(eq(quotations.id, id), eq(quotations.teamId, team.id)))
    .limit(1);

  if (!quotationData) return null;

  const items = await db
    .select({
      item: quotationItems,
      product: products,
    })
    .from(quotationItems)
    .leftJoin(products, eq(quotationItems.productId, products.id))
    .where(eq(quotationItems.quotationId, id))
    .orderBy(quotationItems.sortOrder);

  return {
    ...quotationData.quotation,
    customer: quotationData.customer,
    items: items.map((i) => ({
      ...i.item,
      product: i.product,
    })),
  };
}

/**
 * Get quotation count for dashboard
 */
export async function getQuotationCount() {
  const team = await getTeamForUser();
  if (!team) return 0;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(quotations)
    .where(eq(quotations.teamId, team.id));

  return Number(result[0]?.count || 0);
}
