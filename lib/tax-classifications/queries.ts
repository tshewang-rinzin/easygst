import { db } from '@/lib/db/drizzle';
import { taxClassifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

export async function getTaxClassifications(includeInactive: boolean = false) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const conditions = [eq(taxClassifications.teamId, team.id)];

  if (!includeInactive) {
    conditions.push(eq(taxClassifications.isActive, true));
  }

  const classifications = await db
    .select()
    .from(taxClassifications)
    .where(and(...conditions))
    .orderBy(taxClassifications.sortOrder, taxClassifications.name);

  return classifications;
}

export async function getTaxClassificationById(id: string) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const [classification] = await db
    .select()
    .from(taxClassifications)
    .where(
      and(
        eq(taxClassifications.id, id),
        eq(taxClassifications.teamId, team.id)
      )
    )
    .limit(1);

  return classification;
}

export async function taxClassificationCodeExists(
  code: string,
  excludeId?: string
): Promise<boolean> {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const conditions = [
    eq(taxClassifications.teamId, team.id),
    eq(taxClassifications.code, code.toUpperCase()),
  ];

  if (excludeId !== undefined) {
    conditions.push(eq(taxClassifications.id, excludeId));
  }

  const [existing] = await db
    .select({ id: taxClassifications.id })
    .from(taxClassifications)
    .where(and(...conditions))
    .limit(1);

  if (excludeId !== undefined) {
    return !existing;
  }

  return !!existing;
}
