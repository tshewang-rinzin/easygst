import { db } from '@/lib/db/drizzle';
import { invoices, invoiceItems, supplierBills, supplierBillItems } from '@/lib/db/schema';
import { eq, and, or, gte, lte } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';
import Decimal from 'decimal.js';

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface ClassificationEntry {
  documentType: 'invoice' | 'bill';
  documentNumber: string;
  documentDate: Date;
  partyName: string;
  itemDescription: string;
  classification: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  taxRate: string;
  taxAmount: string;
  currency: string;
}

export interface ClassificationSummary {
  zeroRated: {
    salesAmount: string;
    salesGst: string;
    purchasesAmount: string;
    purchasesGst: string;
    totalAmount: string;
    totalGst: string;
  };
  exempt: {
    salesAmount: string;
    salesGst: string;
    purchasesAmount: string;
    purchasesGst: string;
    totalAmount: string;
    totalGst: string;
  };
}

/**
 * Get all zero-rated and exempt transactions
 */
export async function getExemptAndZeroRatedTransactions(
  startDate?: Date,
  endDate?: Date
): Promise<ClassificationEntry[]> {
  const team = await getTeamForUser();
  if (!team) return [];

  const entries: ClassificationEntry[] = [];

  // Get invoices with zero-rated or exempt items
  const invoiceConditions = [eq(invoices.teamId, team.id)];
  if (startDate) invoiceConditions.push(gte(invoices.invoiceDate, startDate));
  if (endDate) invoiceConditions.push(lte(invoices.invoiceDate, endDate));

  const invoicesData = await db
    .select()
    .from(invoices)
    .where(and(...invoiceConditions));

  for (const invoice of invoicesData) {
    const items = await db
      .select()
      .from(invoiceItems)
      .where(
        and(
          eq(invoiceItems.invoiceId, invoice.id),
          or(
            eq(invoiceItems.gstClassification, 'ZERO_RATED'),
            eq(invoiceItems.gstClassification, 'EXEMPT')
          )
        )
      );

    for (const item of items) {
      entries.push({
        documentType: 'invoice',
        documentNumber: invoice.invoiceNumber,
        documentDate: invoice.invoiceDate,
        partyName: 'Customer', // We'd need to join to get actual name
        itemDescription: item.description,
        classification: item.gstClassification || 'STANDARD',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.lineTotal,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        currency: invoice.currency,
      });
    }
  }

  // Get supplier bills with zero-rated or exempt items
  const billConditions = [eq(supplierBills.teamId, team.id)];
  if (startDate) billConditions.push(gte(supplierBills.billDate, startDate));
  if (endDate) billConditions.push(lte(supplierBills.billDate, endDate));

  const billsData = await db
    .select()
    .from(supplierBills)
    .where(and(...billConditions));

  for (const bill of billsData) {
    const items = await db
      .select()
      .from(supplierBillItems)
      .where(
        and(
          eq(supplierBillItems.billId, bill.id),
          or(
            eq(supplierBillItems.gstClassification, 'ZERO_RATED'),
            eq(supplierBillItems.gstClassification, 'EXEMPT')
          )
        )
      );

    for (const item of items) {
      entries.push({
        documentType: 'bill',
        documentNumber: bill.billNumber,
        documentDate: bill.billDate,
        partyName: 'Supplier', // We'd need to join to get actual name
        itemDescription: item.description,
        classification: item.gstClassification || 'STANDARD',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.lineTotal,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        currency: bill.currency,
      });
    }
  }

  return entries;
}

/**
 * Calculate summary for exempt and zero-rated transactions
 */
export async function getExemptZeroRatedSummary(
  startDate?: Date,
  endDate?: Date
): Promise<ClassificationSummary> {
  const entries = await getExemptAndZeroRatedTransactions(startDate, endDate);

  let zeroRatedSalesAmount = new Decimal(0);
  let zeroRatedSalesGst = new Decimal(0);
  let zeroRatedPurchasesAmount = new Decimal(0);
  let zeroRatedPurchasesGst = new Decimal(0);

  let exemptSalesAmount = new Decimal(0);
  let exemptSalesGst = new Decimal(0);
  let exemptPurchasesAmount = new Decimal(0);
  let exemptPurchasesGst = new Decimal(0);

  for (const entry of entries) {
    const amount = new Decimal(entry.amount);
    const gst = new Decimal(entry.taxAmount);

    if (entry.classification === 'ZERO_RATED') {
      if (entry.documentType === 'invoice') {
        zeroRatedSalesAmount = zeroRatedSalesAmount.plus(amount);
        zeroRatedSalesGst = zeroRatedSalesGst.plus(gst);
      } else {
        zeroRatedPurchasesAmount = zeroRatedPurchasesAmount.plus(amount);
        zeroRatedPurchasesGst = zeroRatedPurchasesGst.plus(gst);
      }
    } else if (entry.classification === 'EXEMPT') {
      if (entry.documentType === 'invoice') {
        exemptSalesAmount = exemptSalesAmount.plus(amount);
        exemptSalesGst = exemptSalesGst.plus(gst);
      } else {
        exemptPurchasesAmount = exemptPurchasesAmount.plus(amount);
        exemptPurchasesGst = exemptPurchasesGst.plus(gst);
      }
    }
  }

  return {
    zeroRated: {
      salesAmount: zeroRatedSalesAmount.toFixed(2),
      salesGst: zeroRatedSalesGst.toFixed(2),
      purchasesAmount: zeroRatedPurchasesAmount.toFixed(2),
      purchasesGst: zeroRatedPurchasesGst.toFixed(2),
      totalAmount: zeroRatedSalesAmount.plus(zeroRatedPurchasesAmount).toFixed(2),
      totalGst: zeroRatedSalesGst.plus(zeroRatedPurchasesGst).toFixed(2),
    },
    exempt: {
      salesAmount: exemptSalesAmount.toFixed(2),
      salesGst: exemptSalesGst.toFixed(2),
      purchasesAmount: exemptPurchasesAmount.toFixed(2),
      purchasesGst: exemptPurchasesGst.toFixed(2),
      totalAmount: exemptSalesAmount.plus(exemptPurchasesAmount).toFixed(2),
      totalGst: exemptSalesGst.plus(exemptPurchasesGst).toFixed(2),
    },
  };
}
