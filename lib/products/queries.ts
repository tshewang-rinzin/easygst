import { db } from '@/lib/db/drizzle';
import { products } from '@/lib/db/schema';
import { eq, and, ilike, desc, or } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all active products for the current team
 * Optionally filter by search term (searches name, sku, description)
 */
export async function getProducts(searchTerm?: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  let query = db
    .select()
    .from(products)
    .where(and(eq(products.teamId, team.id), eq(products.isActive, true)))
    .orderBy(desc(products.createdAt));

  if (searchTerm) {
    const searchPattern = `%${searchTerm}%`;
    query = db
      .select()
      .from(products)
      .where(
        and(
          eq(products.teamId, team.id),
          eq(products.isActive, true),
          or(
            ilike(products.name, searchPattern),
            ilike(products.sku, searchPattern),
            ilike(products.description, searchPattern)
          )
        )
      )
      .orderBy(desc(products.createdAt));
  }

  return query;
}

/**
 * Get a single product by ID (scoped to team)
 */
export async function getProductById(id: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.teamId, team.id)))
    .limit(1);

  return product || null;
}

/**
 * Count total products for the current team
 */
export async function getProductCount() {
  const team = await getTeamForUser();
  if (!team) return 0;

  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.teamId, team.id), eq(products.isActive, true)));

  return result.length;
}
