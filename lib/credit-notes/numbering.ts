import { db } from '@/lib/db/drizzle';
import { creditNoteSequences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Generate a unique credit note number with concurrency safety
 * Format: CN-YYYY-NNNN (e.g., CN-2026-0001)
 */
export async function generateCreditNoteNumber(teamId: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Use a transaction to ensure atomicity
  return await db.transaction(async (tx) => {
    // Try to get existing sequence for this team and year
    const [existingSequence] = await tx
      .select()
      .from(creditNoteSequences)
      .where(
        and(
          eq(creditNoteSequences.teamId, teamId),
          eq(creditNoteSequences.year, currentYear)
        )
      )
      .for('update') // Lock the row for update
      .limit(1);

    let nextNumber: number;

    if (existingSequence) {
      // Increment the existing sequence
      nextNumber = existingSequence.lastNumber + 1;
      await tx
        .update(creditNoteSequences)
        .set({
          lastNumber: nextNumber,
          updatedAt: new Date(),
        })
        .where(eq(creditNoteSequences.id, existingSequence.id));
    } else {
      // Create a new sequence for this year
      nextNumber = 1;
      await tx.insert(creditNoteSequences).values({
        teamId,
        year: currentYear,
        lastNumber: nextNumber,
      });
    }

    // Format the credit note number
    const paddedNumber = String(nextNumber).padStart(4, '0');
    return `CN-${currentYear}-${paddedNumber}`;
  });
}
