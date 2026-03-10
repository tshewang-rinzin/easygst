import { db } from '@/lib/db/drizzle';
import { customerSubscriptionSequences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Generate a unique subscription number with gap-free sequential numbering
 * Format: SUB-YYYY-NNNN (e.g., SUB-2026-0001)
 */
export async function generateSubscriptionNumber(teamId: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  const result = await db.transaction(async (tx) => {
    const [existingSequence] = await tx
      .select()
      .from(customerSubscriptionSequences)
      .where(
        and(
          eq(customerSubscriptionSequences.teamId, teamId),
          eq(customerSubscriptionSequences.year, currentYear)
        )
      )
      .for('update');

    let nextNumber: number;

    if (existingSequence) {
      nextNumber = existingSequence.lastNumber + 1;
      await tx
        .update(customerSubscriptionSequences)
        .set({
          lastNumber: nextNumber,
          lockedAt: new Date(),
        })
        .where(
          and(
            eq(customerSubscriptionSequences.teamId, teamId),
            eq(customerSubscriptionSequences.year, currentYear)
          )
        );
    } else {
      nextNumber = 1;
      await tx.insert(customerSubscriptionSequences).values({
        teamId,
        year: currentYear,
        lastNumber: nextNumber,
        lockedAt: new Date(),
      });
    }

    return `SUB-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
  });

  return result;
}
