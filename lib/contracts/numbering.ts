import { db } from '@/lib/db/drizzle';
import { contractSequences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Generate a unique contract number with gap-free sequential numbering
 * Format: CTR-YYYY-NNNN (e.g., CTR-2026-0001)
 */
export async function generateContractNumber(
  teamId: string,
  prefix: string = 'CTR'
): Promise<string> {
  const currentYear = new Date().getFullYear();

  const result = await db.transaction(async (tx) => {
    const [existingSequence] = await tx
      .select()
      .from(contractSequences)
      .where(
        and(
          eq(contractSequences.teamId, teamId),
          eq(contractSequences.year, currentYear)
        )
      )
      .for('update');

    let nextNumber: number;

    if (existingSequence) {
      nextNumber = existingSequence.lastNumber + 1;
      await tx
        .update(contractSequences)
        .set({
          lastNumber: nextNumber,
          lockedAt: new Date(),
        })
        .where(
          and(
            eq(contractSequences.teamId, teamId),
            eq(contractSequences.year, currentYear)
          )
        );
    } else {
      nextNumber = 1;
      await tx.insert(contractSequences).values({
        teamId,
        year: currentYear,
        lastNumber: nextNumber,
        lockedAt: new Date(),
      });
    }

    return `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
  });

  return result;
}

export async function previewNextContractNumber(
  teamId: string,
  prefix: string = 'CTR'
): Promise<string> {
  const currentYear = new Date().getFullYear();

  const [sequence] = await db
    .select()
    .from(contractSequences)
    .where(
      and(
        eq(contractSequences.teamId, teamId),
        eq(contractSequences.year, currentYear)
      )
    )
    .limit(1);

  const nextNumber = sequence ? sequence.lastNumber + 1 : 1;
  return `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
}
