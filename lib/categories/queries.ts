import { db } from '@/lib/db/drizzle';
import { productCategories } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all categories for the current team
 */
export async function getCategories(includeInactive = false) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [eq(productCategories.teamId, team.id)];

  if (!includeInactive) {
    conditions.push(eq(productCategories.isActive, true));
  }

  const categories = await db
    .select()
    .from(productCategories)
    .where(and(...conditions))
    .orderBy(productCategories.name);

  return categories;
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(id: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [category] = await db
    .select()
    .from(productCategories)
    .where(
      and(
        eq(productCategories.id, id),
        eq(productCategories.teamId, team.id)
      )
    )
    .limit(1);

  return category || null;
}

/**
 * Get active categories for dropdown
 */
export async function getActiveCategoriesForDropdown() {
  const categories = await getCategories(false);
  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));
}
