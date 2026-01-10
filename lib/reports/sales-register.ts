import { db } from '@/lib/db/drizzle';
import { invoices, invoiceItems, customers } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

export interface SalesRegisterEntry {
  id: string;
  date: Date;
  type: 'invoice' | 'cash_sale';
  number: string;
  customerName: string;
  taxableAmount: string;
  gstClassification: string;
  gstRate: string;
  gstAmount: string;
  totalAmount: string;
  currency: string;
}

export interface SalesRegisterSummary {
  totalSales: number;
  taxableAmount: number;
  standardRated: {
    amount: number;
    gst: number;
  };
  zeroRated: {
    amount: number;
    gst: number;
  };
  exempt: {
    amount: number;
    gst: number;
  };
  totalGst: number;
}

/**
 * Get all sales (invoices) for sales register
 */
export async function getSalesRegister(startDate?: Date, endDate?: Date) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [eq(invoices.teamId, team.id)];

  if (startDate) {
    conditions.push(gte(invoices.invoiceDate, startDate));
  }

  if (endDate) {
    conditions.push(lte(invoices.invoiceDate, endDate));
  }

  const salesData = await db
    .select({
      invoice: invoices,
      customer: customers,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(invoices.invoiceDate));

  // Get invoice items for GST classification breakdown
  const entries: SalesRegisterEntry[] = [];

  for (const { invoice, customer } of salesData) {
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    // Group by GST classification
    const classificationMap = new Map<string, { taxable: number; gst: number; rate: number }>();

    for (const item of items) {
      const classification = item.gstClassification || 'STANDARD';
      const taxable = parseFloat(item.lineTotal) - parseFloat(item.discountAmount || '0');
      const gst = parseFloat(item.taxAmount);
      const rate = parseFloat(item.taxRate);

      if (classificationMap.has(classification)) {
        const existing = classificationMap.get(classification)!;
        existing.taxable += taxable;
        existing.gst += gst;
      } else {
        classificationMap.set(classification, { taxable, gst, rate });
      }
    }

    // Create entry for each classification
    for (const [classification, amounts] of classificationMap.entries()) {
      entries.push({
        id: invoice.id,
        date: invoice.invoiceDate,
        type: 'invoice',
        number: invoice.invoiceNumber,
        customerName: customer?.name || 'N/A',
        taxableAmount: amounts.taxable.toFixed(2),
        gstClassification: classification,
        gstRate: amounts.rate.toFixed(2),
        gstAmount: amounts.gst.toFixed(2),
        totalAmount: (amounts.taxable + amounts.gst).toFixed(2),
        currency: invoice.currency,
      });
    }
  }

  return entries;
}

/**
 * Calculate sales register summary
 */
export async function getSalesRegisterSummary(startDate?: Date, endDate?: Date): Promise<SalesRegisterSummary> {
  const entries = await getSalesRegister(startDate, endDate);

  const summary: SalesRegisterSummary = {
    totalSales: 0,
    taxableAmount: 0,
    standardRated: { amount: 0, gst: 0 },
    zeroRated: { amount: 0, gst: 0 },
    exempt: { amount: 0, gst: 0 },
    totalGst: 0,
  };

  for (const entry of entries) {
    const taxable = parseFloat(entry.taxableAmount);
    const gst = parseFloat(entry.gstAmount);
    const total = parseFloat(entry.totalAmount);

    summary.totalSales += total;
    summary.taxableAmount += taxable;
    summary.totalGst += gst;

    switch (entry.gstClassification) {
      case 'STANDARD':
        summary.standardRated.amount += taxable;
        summary.standardRated.gst += gst;
        break;
      case 'ZERO_RATED':
        summary.zeroRated.amount += taxable;
        summary.zeroRated.gst += gst;
        break;
      case 'EXEMPT':
        summary.exempt.amount += taxable;
        summary.exempt.gst += gst;
        break;
    }
  }

  return summary;
}
