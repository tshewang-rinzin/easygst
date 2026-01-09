import { db } from '@/lib/db/drizzle';
import { supplierBillSequences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Generate a unique supplier bill number with gap-free sequential numbering
 * Uses database row-level locking to ensure concurrency safety
 *
 * Format: PREFIX-YYYY-NNNN (e.g., BILL-2026-0001)
 *
 * @param teamId - The team ID
 * @param prefix - Bill number prefix (default: 'BILL')
 * @returns Promise<string> - The generated bill number
 */
export async function generateBillNumber(
  teamId: number,
  prefix: string = 'BILL'
): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Use a database transaction with row-level locking to ensure no gaps
  const result = await db.transaction(async (tx) => {
    // Step 1: Try to get the existing sequence for this team and year
    // Use SELECT FOR UPDATE to lock the row until transaction commits
    const [existingSequence] = await tx
      .select()
      .from(supplierBillSequences)
      .where(
        and(
          eq(supplierBillSequences.teamId, teamId),
          eq(supplierBillSequences.year, currentYear)
        )
      )
      .for('update'); // Row-level lock - critical for concurrency!

    let nextNumber: number;

    if (existingSequence) {
      // Step 2a: Increment the existing sequence
      nextNumber = existingSequence.lastNumber + 1;

      await tx
        .update(supplierBillSequences)
        .set({
          lastNumber: nextNumber,
          lockedAt: new Date(),
        })
        .where(
          and(
            eq(supplierBillSequences.teamId, teamId),
            eq(supplierBillSequences.year, currentYear)
          )
        );
    } else {
      // Step 2b: Create a new sequence for this team and year
      nextNumber = 1;

      await tx.insert(supplierBillSequences).values({
        teamId: teamId,
        year: currentYear,
        lastNumber: nextNumber,
        lockedAt: new Date(),
      });
    }

    // Step 3: Format the bill number
    // Format: PREFIX-YYYY-NNNN (e.g., BILL-2026-0001)
    const formattedNumber = `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;

    return formattedNumber;
  });

  return result;
}

/**
 * Get the next bill number preview (without incrementing)
 * Useful for showing the user what the next bill number will be
 *
 * @param teamId - The team ID
 * @param prefix - Bill number prefix (default: 'BILL')
 * @returns Promise<string> - The next bill number that will be generated
 */
export async function previewNextBillNumber(
  teamId: number,
  prefix: string = 'BILL'
): Promise<string> {
  const currentYear = new Date().getFullYear();

  const [sequence] = await db
    .select()
    .from(supplierBillSequences)
    .where(
      and(
        eq(supplierBillSequences.teamId, teamId),
        eq(supplierBillSequences.year, currentYear)
      )
    )
    .limit(1);

  const nextNumber = sequence ? sequence.lastNumber + 1 : 1;
  return `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
}
