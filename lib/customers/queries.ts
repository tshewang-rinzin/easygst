import { db } from '@/lib/db/drizzle';
import { customers } from '@/lib/db/schema';
import { eq, and, ilike, desc, or } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all active customers for the current team
 * Optionally filter by search term (searches name, email, mobile)
 */
export async function getCustomers(searchTerm?: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  let query = db
    .select()
    .from(customers)
    .where(and(eq(customers.teamId, team.id), eq(customers.isActive, true)))
    .orderBy(desc(customers.createdAt));

  if (searchTerm) {
    const searchPattern = `%${searchTerm}%`;
    query = db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.teamId, team.id),
          eq(customers.isActive, true),
          or(
            ilike(customers.name, searchPattern),
            ilike(customers.email, searchPattern),
            ilike(customers.mobile, searchPattern)
          )
        )
      )
      .orderBy(desc(customers.createdAt));
  }

  return query;
}

/**
 * Get a single customer by ID (scoped to team)
 */
export async function getCustomerById(id: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.teamId, team.id)))
    .limit(1);

  return customer || null;
}

/**
 * Count total customers for the current team
 */
export async function getCustomerCount() {
  const team = await getTeamForUser();
  if (!team) return 0;

  const result = await db
    .select()
    .from(customers)
    .where(and(eq(customers.teamId, team.id), eq(customers.isActive, true)));

  return result.length;
}
