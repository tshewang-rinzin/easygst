import { db } from '@/lib/db/drizzle';
import { debitNoteSequences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Generate a unique debit note number with concurrency safety
 * Format: DN-YYYY-NNNN (e.g., DN-2026-0001)
 */
export async function generateDebitNoteNumber(teamId: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Use a transaction to ensure atomicity
  return await db.transaction(async (tx) => {
    // Try to get existing sequence for this team and year
    const [existingSequence] = await tx
      .select()
      .from(debitNoteSequences)
      .where(
        and(
          eq(debitNoteSequences.teamId, teamId),
          eq(debitNoteSequences.year, currentYear)
        )
      )
      .for('update') // Lock the row for update
      .limit(1);

    let nextNumber: number;

    if (existingSequence) {
      // Increment the existing sequence
      nextNumber = existingSequence.lastNumber + 1;
      await tx
        .update(debitNoteSequences)
        .set({
          lastNumber: nextNumber,
          updatedAt: new Date(),
        })
        .where(eq(debitNoteSequences.id, existingSequence.id));
    } else {
      // Create a new sequence for this year
      nextNumber = 1;
      await tx.insert(debitNoteSequences).values({
        teamId,
        year: currentYear,
        lastNumber: nextNumber,
      });
    }

    // Format the debit note number
    const paddedNumber = String(nextNumber).padStart(4, '0');
    return `DN-${currentYear}-${paddedNumber}`;
  });
}
