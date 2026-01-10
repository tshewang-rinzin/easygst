import { db } from '@/lib/db/drizzle';
import { invoiceSequences } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Generate a unique invoice number with gap-free sequential numbering
 * Uses database row-level locking to ensure concurrency safety
 *
 * Format: PREFIX-YYYY-NNNN (e.g., INV-2026-0001)
 *
 * @param teamId - The team ID
 * @param prefix - Invoice number prefix (default: 'INV')
 * @returns Promise<string> - The generated invoice number
 */
export async function generateInvoiceNumber(
  teamId: string,
  prefix: string = 'INV'
): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Use a database transaction with row-level locking to ensure no gaps
  const result = await db.transaction(async (tx) => {
    // Step 1: Try to get the existing sequence for this team and year
    // Use SELECT FOR UPDATE to lock the row until transaction commits
    const [existingSequence] = await tx
      .select()
      .from(invoiceSequences)
      .where(
        and(
          eq(invoiceSequences.teamId, teamId),
          eq(invoiceSequences.year, currentYear)
        )
      )
      .for('update'); // Row-level lock - critical for concurrency!

    let nextNumber: number;

    if (existingSequence) {
      // Step 2a: Increment the existing sequence
      nextNumber = existingSequence.lastNumber + 1;

      await tx
        .update(invoiceSequences)
        .set({
          lastNumber: nextNumber,
          lockedAt: new Date(),
        })
        .where(
          and(
            eq(invoiceSequences.teamId, teamId),
            eq(invoiceSequences.year, currentYear)
          )
        );
    } else {
      // Step 2b: Create a new sequence for this team and year
      nextNumber = 1;

      await tx.insert(invoiceSequences).values({
        teamId: teamId,
        year: currentYear,
        lastNumber: nextNumber,
        lockedAt: new Date(),
      });
    }

    // Step 3: Format the invoice number
    // Format: PREFIX-YYYY-NNNN (e.g., INV-2026-0001)
    const formattedNumber = `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;

    return formattedNumber;
  });

  return result;
}

/**
 * Get the next invoice number preview (without incrementing)
 * Useful for showing the user what the next invoice number will be
 *
 * @param teamId - The team ID
 * @param prefix - Invoice number prefix (default: 'INV')
 * @returns Promise<string> - The next invoice number that will be generated
 */
export async function previewNextInvoiceNumber(
  teamId: string,
  prefix: string = 'INV'
): Promise<string> {
  const currentYear = new Date().getFullYear();

  const [sequence] = await db
    .select()
    .from(invoiceSequences)
    .where(
      and(
        eq(invoiceSequences.teamId, teamId),
        eq(invoiceSequences.year, currentYear)
      )
    )
    .limit(1);

  const nextNumber = sequence ? sequence.lastNumber + 1 : 1;
  return `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Get the current year's invoice count for a team
 *
 * @param teamId - The team ID
 * @returns Promise<number> - The count of invoices this year
 */
export async function getCurrentYearInvoiceCount(
  teamId: string
): Promise<number> {
  const currentYear = new Date().getFullYear();

  const [sequence] = await db
    .select()
    .from(invoiceSequences)
    .where(
      and(
        eq(invoiceSequences.teamId, teamId),
        eq(invoiceSequences.year, currentYear)
      )
    )
    .limit(1);

  return sequence ? sequence.lastNumber : 0;
}

/**
 * Reset the invoice sequence for a team and year (DANGEROUS - use with caution!)
 * This should only be used for testing or when starting a new fiscal year manually
 *
 * @param teamId - The team ID
 * @param year - The year to reset (default: current year)
 */
export async function resetInvoiceSequence(
  teamId: string,
  year?: number
): Promise<void> {
  const targetYear = year || new Date().getFullYear();

  await db
    .delete(invoiceSequences)
    .where(
      and(
        eq(invoiceSequences.teamId, teamId),
        eq(invoiceSequences.year, targetYear)
      )
    );
}
