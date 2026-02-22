import { db } from '@/lib/db/drizzle';
import { productCategories } from '@/lib/db/schema';
import { eq, and, desc, isNull, asc } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

export type CategoryWithChildren = typeof productCategories.$inferSelect & {
  children?: CategoryWithChildren[];
};

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
    .orderBy(asc(productCategories.sortOrder), asc(productCategories.name));

  return categories;
}

/**
 * Get categories as a tree structure
 */
export async function getCategoryTree(includeInactive = false): Promise<CategoryWithChildren[]> {
  const allCategories = await getCategories(includeInactive);

  const categoryMap = new Map<string, CategoryWithChildren>();
  const roots: CategoryWithChildren[] = [];

  // First pass: create map
  for (const cat of allCategories) {
    categoryMap.set(cat.id, { ...cat, children: [] });
  }

  // Second pass: build tree
  for (const cat of allCategories) {
    const node = categoryMap.get(cat.id)!;
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      categoryMap.get(cat.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
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
 * Get active categories for dropdown (flat list with hierarchy info)
 */
export async function getActiveCategoriesForDropdown() {
  const tree = await getCategoryTree(false);

  const flatList: { id: string; name: string; depth: number; parentId: string | null }[] = [];

  function flatten(categories: CategoryWithChildren[], depth: number) {
    for (const cat of categories) {
      flatList.push({
        id: cat.id,
        name: cat.name,
        depth,
        parentId: cat.parentId,
      });
      if (cat.children?.length) {
        flatten(cat.children, depth + 1);
      }
    }
  }

  flatten(tree, 0);
  return flatList;
}
