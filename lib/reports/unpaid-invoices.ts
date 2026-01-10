import { db } from '@/lib/db/drizzle';
import { invoices, customers } from '@/lib/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';
import Decimal from 'decimal.js';

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface UnpaidInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  customerName: string;
  customerEmail: string | null;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;
  currency: string;
  paymentStatus: string;
  daysOverdue: number | null;
}

export interface UnpaidInvoicesSummary {
  totalUnpaid: string;
  totalOverdue: string;
  unpaidCount: number;
  overdueCount: number;
  averageDaysOverdue: number;
}

/**
 * Get all unpaid and partially paid invoices
 */
export async function getUnpaidInvoices() {
  const team = await getTeamForUser();
  if (!team) return [];

  const unpaidInvoicesData = await db
    .select({
      invoice: invoices,
      customer: customers,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(
      and(
        eq(invoices.teamId, team.id),
        or(
          eq(invoices.paymentStatus, 'unpaid'),
          eq(invoices.paymentStatus, 'partial')
        )
      )
    )
    .orderBy(desc(invoices.invoiceDate));

  const today = new Date();
  const results: UnpaidInvoice[] = unpaidInvoicesData.map(({ invoice, customer }) => {
    let daysOverdue = null;
    if (invoice.dueDate) {
      const due = new Date(invoice.dueDate);
      if (due < today) {
        daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      customerName: customer?.name || 'N/A',
      customerEmail: customer?.email || null,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      currency: invoice.currency,
      paymentStatus: invoice.paymentStatus,
      daysOverdue,
    };
  });

  return results;
}

/**
 * Calculate summary statistics for unpaid invoices
 */
export async function getUnpaidInvoicesSummary(): Promise<UnpaidInvoicesSummary> {
  const unpaidInvoices = await getUnpaidInvoices();

  let totalUnpaid = new Decimal(0);
  let totalOverdue = new Decimal(0);
  let overdueCount = 0;
  let totalDaysOverdue = 0;

  for (const invoice of unpaidInvoices) {
    totalUnpaid = totalUnpaid.plus(invoice.amountDue);

    if (invoice.daysOverdue !== null && invoice.daysOverdue > 0) {
      totalOverdue = totalOverdue.plus(invoice.amountDue);
      overdueCount++;
      totalDaysOverdue += invoice.daysOverdue;
    }
  }

  const averageDaysOverdue = overdueCount > 0 ? Math.round(totalDaysOverdue / overdueCount) : 0;

  return {
    totalUnpaid: totalUnpaid.toFixed(2),
    totalOverdue: totalOverdue.toFixed(2),
    unpaidCount: unpaidInvoices.length,
    overdueCount,
    averageDaysOverdue,
  };
}
