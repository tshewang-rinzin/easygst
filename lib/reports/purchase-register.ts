import { db } from '@/lib/db/drizzle';
import { supplierBills, supplierBillItems, suppliers } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, ne } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

export interface PurchaseRegisterEntry {
  id: string;
  date: Date;
  number: string;
  supplierName: string;
  taxableAmount: string;
  gstClassification: string;
  gstRate: string;
  gstAmount: string;
  totalAmount: string;
  currency: string;
}

export interface PurchaseRegisterSummary {
  totalPurchases: number;
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
  totalInputGst: number; // Input GST (can be claimed)
}

/**
 * Get all purchases (supplier bills) for purchase register
 */
export async function getPurchaseRegister(startDate?: Date, endDate?: Date) {
  const team = await getTeamForUser();
  if (!team) {
    console.log('[Purchase Register] No team found');
    return [];
  }

  console.log('[Purchase Register] Team ID:', team.id);
  console.log('[Purchase Register] Date range:', startDate, 'to', endDate);

  const conditions = [
    eq(supplierBills.teamId, team.id),
    ne(supplierBills.status, 'cancelled'),
    ne(supplierBills.status, 'draft'), // Exclude draft bills from purchase register
  ];

  if (startDate) {
    conditions.push(gte(supplierBills.billDate, startDate));
  }

  if (endDate) {
    conditions.push(lte(supplierBills.billDate, endDate));
  }

  const purchaseData = await db
    .select({
      bill: supplierBills,
      supplier: suppliers,
    })
    .from(supplierBills)
    .leftJoin(suppliers, eq(supplierBills.supplierId, suppliers.id))
    .where(and(...conditions))
    .orderBy(desc(supplierBills.billDate));

  console.log('[Purchase Register] Found bills:', purchaseData.length);

  // Get bill items for GST classification breakdown
  const entries: PurchaseRegisterEntry[] = [];

  for (const { bill, supplier } of purchaseData) {
    const items = await db
      .select()
      .from(supplierBillItems)
      .where(eq(supplierBillItems.billId, bill.id));

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
        id: bill.id,
        date: bill.billDate,
        number: bill.billNumber,
        supplierName: supplier?.name || 'N/A',
        taxableAmount: amounts.taxable.toFixed(2),
        gstClassification: classification,
        gstRate: amounts.rate.toFixed(2),
        gstAmount: amounts.gst.toFixed(2),
        totalAmount: (amounts.taxable + amounts.gst).toFixed(2),
        currency: bill.currency,
      });
    }
  }

  console.log('[Purchase Register] Total entries created:', entries.length);

  return entries;
}

/**
 * Calculate purchase register summary
 */
export async function getPurchaseRegisterSummary(startDate?: Date, endDate?: Date): Promise<PurchaseRegisterSummary> {
  const entries = await getPurchaseRegister(startDate, endDate);

  const summary: PurchaseRegisterSummary = {
    totalPurchases: 0,
    taxableAmount: 0,
    standardRated: { amount: 0, gst: 0 },
    zeroRated: { amount: 0, gst: 0 },
    exempt: { amount: 0, gst: 0 },
    totalInputGst: 0,
  };

  for (const entry of entries) {
    const taxable = parseFloat(entry.taxableAmount);
    const gst = parseFloat(entry.gstAmount);
    const total = parseFloat(entry.totalAmount);

    summary.totalPurchases += total;
    summary.taxableAmount += taxable;
    summary.totalInputGst += gst;

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
