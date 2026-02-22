import { db } from '@/lib/db/drizzle';
import { quotationSequences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Generate a unique quotation number with gap-free sequential numbering
 * Format: QT-YYYY-NNNN (e.g., QT-2026-0001)
 */
export async function generateQuotationNumber(
  teamId: string,
  prefix: string = 'QT'
): Promise<string> {
  const currentYear = new Date().getFullYear();

  const result = await db.transaction(async (tx) => {
    const [existingSequence] = await tx
      .select()
      .from(quotationSequences)
      .where(
        and(
          eq(quotationSequences.teamId, teamId),
          eq(quotationSequences.year, currentYear)
        )
      )
      .for('update');

    let nextNumber: number;

    if (existingSequence) {
      nextNumber = existingSequence.lastNumber + 1;
      await tx
        .update(quotationSequences)
        .set({
          lastNumber: nextNumber,
          lockedAt: new Date(),
        })
        .where(
          and(
            eq(quotationSequences.teamId, teamId),
            eq(quotationSequences.year, currentYear)
          )
        );
    } else {
      nextNumber = 1;
      await tx.insert(quotationSequences).values({
        teamId,
        year: currentYear,
        lastNumber: nextNumber,
        prefix,
        lockedAt: new Date(),
      });
    }

    return `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
  });

  return result;
}
