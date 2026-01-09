import { db } from '@/lib/db/drizzle';
import { suppliers } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, desc, like, or } from 'drizzle-orm';

/**
 * Get all suppliers for the current team
 */
export async function getSuppliers() {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.teamId, team.id), eq(suppliers.isActive, true)))
    .orderBy(desc(suppliers.createdAt));

  return results;
}

/**
 * Get a single supplier by ID
 */
export async function getSupplierById(id: number) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.teamId, team.id)))
    .limit(1);

  return supplier || null;
}

/**
 * Search suppliers by name, email, or GST number
 */
export async function searchSuppliers(query: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  const searchPattern = `%${query}%`;

  const results = await db
    .select()
    .from(suppliers)
    .where(
      and(
        eq(suppliers.teamId, team.id),
        eq(suppliers.isActive, true),
        or(
          like(suppliers.name, searchPattern),
          like(suppliers.email, searchPattern),
          like(suppliers.gstNumber, searchPattern)
        )
      )
    )
    .orderBy(suppliers.name)
    .limit(10);

  return results;
}

/**
 * Get supplier count
 */
export async function getSupplierCount() {
  const team = await getTeamForUser();
  if (!team) return 0;

  const results = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.teamId, team.id), eq(suppliers.isActive, true)));

  return results.length;
}
