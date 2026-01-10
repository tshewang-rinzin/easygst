import { db } from '@/lib/db/drizzle';
import { units } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, asc } from 'drizzle-orm';

/**
 * Get all units for the current team
 */
export async function getUnits(includeInactive = false) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [eq(units.teamId, team.id)];

  if (!includeInactive) {
    conditions.push(eq(units.isActive, true));
  }

  return await db
    .select()
    .from(units)
    .where(and(...conditions))
    .orderBy(asc(units.sortOrder), asc(units.name));
}

/**
 * Get a single unit by ID
 */
export async function getUnitById(id: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [unit] = await db
    .select()
    .from(units)
    .where(and(eq(units.id, id), eq(units.teamId, team.id)))
    .limit(1);

  return unit || null;
}

/**
 * Check if a unit name already exists for the team
 */
export async function unitNameExists(name: string, excludeId?: string) {
  const team = await getTeamForUser();
  if (!team) return false;

  const conditions = [
    eq(units.teamId, team.id),
    eq(units.name, name),
  ];

  if (excludeId) {
    conditions.push(eq(units.id, excludeId));
  }

  const [existing] = await db
    .select()
    .from(units)
    .where(and(...conditions))
    .limit(1);

  return !!existing;
}
