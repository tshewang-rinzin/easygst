import { db } from '@/lib/db/drizzle';
import { invoices, customers, payments } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Get all cash sales (invoices with immediate payment)
 * Cash sales are identified by: status='paid', paymentStatus='paid', and paymentTerms containing 'Cash Sale'
 */
export async function getCashSales() {
  const team = await getTeamForUser();
  if (!team) return [];

  const result = await db
    .select({
      invoice: invoices,
      customer: customers,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(
      and(
        eq(invoices.teamId, team.id),
        eq(invoices.status, 'paid'),
        eq(invoices.paymentStatus, 'paid')
      )
    )
    .orderBy(desc(invoices.invoiceDate));

  // Filter for cash sales (where paymentTerms contains 'Cash Sale')
  return result.filter(
    (r) => r.invoice.paymentTerms?.includes('Cash Sale') || false
  );
}

/**
 * Get cash sale with payment details
 */
export async function getCashSaleWithDetails(id: number) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [invoiceData] = await db
    .select({
      invoice: invoices,
      customer: customers,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(eq(invoices.id, id), eq(invoices.teamId, team.id)))
    .limit(1);

  if (!invoiceData) return null;

  // Get payment record
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, id))
    .limit(1);

  return {
    ...invoiceData.invoice,
    customer: invoiceData.customer,
    payment: payment || null,
  };
}
