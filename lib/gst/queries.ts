import { db } from '@/lib/db/drizzle';
import {
  gstReturns,
  gstPeriodLocks,
  invoices,
  supplierBills,
  invoiceItems,
  supplierBillItems,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, between, gte, lte } from 'drizzle-orm';
import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Get all GST returns for the current team
 */
export async function getGstReturns() {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const returns = await db
    .select()
    .from(gstReturns)
    .where(eq(gstReturns.teamId, team.id))
    .orderBy(gstReturns.periodStart);

  return returns;
}

/**
 * Get a single GST return by ID
 */
export async function getGstReturnById(id: number) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const gstReturn = await db
    .select()
    .from(gstReturns)
    .where(and(eq(gstReturns.id, id), eq(gstReturns.teamId, team.id)))
    .limit(1);

  return gstReturn[0] || null;
}

/**
 * Check if a period is locked
 */
export async function isPeriodLocked(periodStart: Date, periodEnd: Date): Promise<boolean> {
  const team = await getTeamForUser();
  if (!team) {
    return false;
  }

  const locks = await db
    .select()
    .from(gstPeriodLocks)
    .where(
      and(
        eq(gstPeriodLocks.teamId, team.id),
        gte(gstPeriodLocks.periodStart, periodStart),
        lte(gstPeriodLocks.periodEnd, periodEnd)
      )
    );

  return locks.length > 0;
}

/**
 * Get all period locks for the team
 */
export async function getPeriodLocks() {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const locks = await db
    .select()
    .from(gstPeriodLocks)
    .where(eq(gstPeriodLocks.teamId, team.id))
    .orderBy(gstPeriodLocks.periodStart);

  return locks;
}

/**
 * Calculate GST for a specific period
 */
export async function calculateGstForPeriod(periodStart: Date, periodEnd: Date) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  // Get all paid invoices in the period (Output GST)
  const paidInvoices = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, team.id),
        eq(invoices.status, 'paid'),
        gte(invoices.invoiceDate, periodStart),
        lte(invoices.invoiceDate, periodEnd)
      )
    );

  // Get all supplier bills in the period (Input GST)
  const supplierBillsData = await db
    .select()
    .from(supplierBills)
    .where(
      and(
        eq(supplierBills.teamId, team.id),
        gte(supplierBills.billDate, periodStart),
        lte(supplierBills.billDate, periodEnd)
      )
    );

  // Calculate Output GST by classification
  let standardSales = new Decimal(0);
  let standardOutputGst = new Decimal(0);
  let zeroRatedSales = new Decimal(0);
  let exemptSales = new Decimal(0);

  for (const invoice of paidInvoices) {
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    for (const item of items) {
      const subtotal = new Decimal(item.quantity)
        .mul(item.unitPrice)
        .minus(item.discount || 0);

      if (item.gstClassification === 'STANDARD') {
        standardSales = standardSales.plus(subtotal);
        standardOutputGst = standardOutputGst.plus(item.taxAmount || 0);
      } else if (item.gstClassification === 'ZERO_RATED') {
        zeroRatedSales = zeroRatedSales.plus(subtotal);
      } else {
        exemptSales = exemptSales.plus(subtotal);
      }
    }
  }

  // Calculate Input GST by classification
  let standardPurchases = new Decimal(0);
  let standardInputGst = new Decimal(0);
  let zeroRatedPurchases = new Decimal(0);
  let exemptPurchases = new Decimal(0);

  for (const bill of supplierBillsData) {
    const items = await db
      .select()
      .from(supplierBillItems)
      .where(eq(supplierBillItems.billId, bill.id));

    for (const item of items) {
      const subtotal = new Decimal(item.quantity)
        .mul(item.unitPrice)
        .minus(item.discount || 0);

      if (item.gstClassification === 'STANDARD') {
        standardPurchases = standardPurchases.plus(subtotal);
        standardInputGst = standardInputGst.plus(item.taxAmount || 0);
      } else if (item.gstClassification === 'ZERO_RATED') {
        zeroRatedPurchases = zeroRatedPurchases.plus(subtotal);
      } else {
        exemptPurchases = exemptPurchases.plus(subtotal);
      }
    }
  }

  const totalOutputGst = standardOutputGst;
  const totalInputGst = standardInputGst;
  const netGstPayable = totalOutputGst.minus(totalInputGst);

  return {
    outputGst: totalOutputGst.toFixed(2),
    inputGst: totalInputGst.toFixed(2),
    netGstPayable: netGstPayable.toFixed(2),
    salesBreakdown: {
      standard: {
        sales: standardSales.toFixed(2),
        gst: standardOutputGst.toFixed(2),
      },
      zeroRated: {
        sales: zeroRatedSales.toFixed(2),
        gst: '0.00',
      },
      exempt: {
        sales: exemptSales.toFixed(2),
        gst: '0.00',
      },
    },
    purchasesBreakdown: {
      standard: {
        purchases: standardPurchases.toFixed(2),
        gst: standardInputGst.toFixed(2),
      },
      zeroRated: {
        purchases: zeroRatedPurchases.toFixed(2),
        gst: '0.00',
      },
      exempt: {
        purchases: exemptPurchases.toFixed(2),
        gst: '0.00',
      },
    },
  };
}

/**
 * Get GST summary for current period (month to date)
 */
export async function getCurrentPeriodGstSummary() {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return calculateGstForPeriod(periodStart, periodEnd);
}

/**
 * Generate return number for a new GST return
 */
export function generateReturnNumber(periodStart: Date, returnType: string): string {
  const year = periodStart.getFullYear();
  const month = String(periodStart.getMonth() + 1).padStart(2, '0');

  if (returnType === 'monthly') {
    return `GST-${year}-${month}`;
  } else if (returnType === 'quarterly') {
    const quarter = Math.floor(periodStart.getMonth() / 3) + 1;
    return `GST-${year}-Q${quarter}`;
  } else {
    return `GST-${year}-ANNUAL`;
  }
}
