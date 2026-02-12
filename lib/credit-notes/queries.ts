import { db } from '@/lib/db/drizzle';
import {
  creditNotes,
  creditNoteItems,
  creditNoteApplications,
  customers,
  invoices,
  products,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Get all credit notes for the current team
 */
export async function getCreditNotes() {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const result = await db
    .select({
      creditNote: creditNotes,
      customer: customers,
      invoice: invoices,
    })
    .from(creditNotes)
    .leftJoin(customers, eq(creditNotes.customerId, customers.id))
    .leftJoin(invoices, eq(creditNotes.invoiceId, invoices.id))
    .where(eq(creditNotes.teamId, team.id))
    .orderBy(desc(creditNotes.createdAt));

  return result;
}

/**
 * Get a single credit note with all details
 */
export async function getCreditNoteWithDetails(id: string) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  // Get credit note with customer and invoice
  const [creditNoteData] = await db
    .select({
      creditNote: creditNotes,
      customer: customers,
      invoice: invoices,
    })
    .from(creditNotes)
    .leftJoin(customers, eq(creditNotes.customerId, customers.id))
    .leftJoin(invoices, eq(creditNotes.invoiceId, invoices.id))
    .where(and(eq(creditNotes.id, id), eq(creditNotes.teamId, team.id)))
    .limit(1);

  if (!creditNoteData) {
    return null;
  }

  // Get credit note items
  const items = await db
    .select({
      item: creditNoteItems,
      product: products,
    })
    .from(creditNoteItems)
    .leftJoin(products, eq(creditNoteItems.productId, products.id))
    .where(eq(creditNoteItems.creditNoteId, id))
    .orderBy(creditNoteItems.sortOrder);

  // Get applications
  const applications = await db
    .select({
      application: creditNoteApplications,
      invoice: invoices,
    })
    .from(creditNoteApplications)
    .leftJoin(invoices, eq(creditNoteApplications.invoiceId, invoices.id))
    .where(eq(creditNoteApplications.creditNoteId, id))
    .orderBy(desc(creditNoteApplications.createdAt));

  return {
    ...creditNoteData.creditNote,
    customer: creditNoteData.customer,
    originalInvoice: creditNoteData.invoice,
    items: items.map((i) => ({
      ...i.item,
      product: i.product,
    })),
    applications: applications.map((a) => ({
      ...a.application,
      invoice: a.invoice,
    })),
  };
}

/**
 * Get credit notes for a specific customer
 */
export async function getCreditNotesForCustomer(customerId: string) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const result = await db
    .select()
    .from(creditNotes)
    .where(
      and(
        eq(creditNotes.teamId, team.id),
        eq(creditNotes.customerId, customerId)
      )
    )
    .orderBy(desc(creditNotes.createdAt));

  return result;
}

/**
 * Get unapplied credit notes for a customer (for applying to invoices)
 */
export async function getUnappliedCreditNotesForCustomer(customerId: string) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const result = await db
    .select()
    .from(creditNotes)
    .where(
      and(
        eq(creditNotes.teamId, team.id),
        eq(creditNotes.customerId, customerId),
        eq(creditNotes.status, 'issued')
      )
    )
    .orderBy(desc(creditNotes.createdAt));

  // Filter to only those with unapplied balance
  return result.filter((cn) => parseFloat(cn.unappliedAmount) > 0);
}

/**
 * Get credit notes for a specific invoice
 */
export async function getCreditNotesForInvoice(invoiceId: string) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const result = await db
    .select()
    .from(creditNotes)
    .where(
      and(
        eq(creditNotes.teamId, team.id),
        eq(creditNotes.invoiceId, invoiceId)
      )
    )
    .orderBy(desc(creditNotes.createdAt));

  return result;
}
