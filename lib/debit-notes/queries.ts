import { db } from '@/lib/db/drizzle';
import {
  debitNotes,
  debitNoteItems,
  debitNoteApplications,
  suppliers,
  supplierBills,
  products,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Get all debit notes for the current team
 */
export async function getDebitNotes() {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const result = await db
    .select({
      debitNote: debitNotes,
      supplier: suppliers,
      bill: supplierBills,
    })
    .from(debitNotes)
    .leftJoin(suppliers, eq(debitNotes.supplierId, suppliers.id))
    .leftJoin(supplierBills, eq(debitNotes.billId, supplierBills.id))
    .where(eq(debitNotes.teamId, team.id))
    .orderBy(desc(debitNotes.createdAt));

  return result;
}

/**
 * Get a single debit note with all details
 */
export async function getDebitNoteWithDetails(id: string) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  // Get debit note with supplier and bill
  const [debitNoteData] = await db
    .select({
      debitNote: debitNotes,
      supplier: suppliers,
      bill: supplierBills,
    })
    .from(debitNotes)
    .leftJoin(suppliers, eq(debitNotes.supplierId, suppliers.id))
    .leftJoin(supplierBills, eq(debitNotes.billId, supplierBills.id))
    .where(and(eq(debitNotes.id, id), eq(debitNotes.teamId, team.id)))
    .limit(1);

  if (!debitNoteData) {
    return null;
  }

  // Get debit note items
  const items = await db
    .select({
      item: debitNoteItems,
      product: products,
    })
    .from(debitNoteItems)
    .leftJoin(products, eq(debitNoteItems.productId, products.id))
    .where(eq(debitNoteItems.debitNoteId, id))
    .orderBy(debitNoteItems.sortOrder);

  // Get applications
  const applications = await db
    .select({
      application: debitNoteApplications,
      bill: supplierBills,
    })
    .from(debitNoteApplications)
    .leftJoin(supplierBills, eq(debitNoteApplications.billId, supplierBills.id))
    .where(eq(debitNoteApplications.debitNoteId, id))
    .orderBy(desc(debitNoteApplications.createdAt));

  return {
    ...debitNoteData.debitNote,
    supplier: debitNoteData.supplier,
    originalBill: debitNoteData.bill,
    items: items.map((i) => ({
      ...i.item,
      product: i.product,
    })),
    applications: applications.map((a) => ({
      ...a.application,
      bill: a.bill,
    })),
  };
}

/**
 * Get debit notes for a specific supplier
 */
export async function getDebitNotesForSupplier(supplierId: string) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const result = await db
    .select()
    .from(debitNotes)
    .where(
      and(
        eq(debitNotes.teamId, team.id),
        eq(debitNotes.supplierId, supplierId)
      )
    )
    .orderBy(desc(debitNotes.createdAt));

  return result;
}

/**
 * Get unapplied debit notes for a supplier (for applying to bills)
 */
export async function getUnappliedDebitNotesForSupplier(supplierId: string) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const result = await db
    .select()
    .from(debitNotes)
    .where(
      and(
        eq(debitNotes.teamId, team.id),
        eq(debitNotes.supplierId, supplierId),
        eq(debitNotes.status, 'issued')
      )
    )
    .orderBy(desc(debitNotes.createdAt));

  // Filter to only those with unapplied balance
  return result.filter((dn) => parseFloat(dn.unappliedAmount) > 0);
}

/**
 * Get debit notes for a specific bill
 */
export async function getDebitNotesForBill(billId: string) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const result = await db
    .select()
    .from(debitNotes)
    .where(
      and(
        eq(debitNotes.teamId, team.id),
        eq(debitNotes.billId, billId)
      )
    )
    .orderBy(desc(debitNotes.createdAt));

  return result;
}
