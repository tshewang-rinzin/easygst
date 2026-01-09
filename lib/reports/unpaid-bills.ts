import { db } from '@/lib/db/drizzle';
import { supplierBills, suppliers } from '@/lib/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';
import Decimal from 'decimal.js';

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface UnpaidBill {
  id: number;
  billNumber: string;
  billDate: Date;
  dueDate: Date | null;
  supplierName: string;
  supplierEmail: string | null;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;
  currency: string;
  paymentStatus: string;
  daysOverdue: number | null;
}

export interface UnpaidBillsSummary {
  totalUnpaid: string;
  totalOverdue: string;
  unpaidCount: number;
  overdueCount: number;
  averageDaysOverdue: number;
}

/**
 * Get all unpaid and partially paid supplier bills
 */
export async function getUnpaidBills() {
  const team = await getTeamForUser();
  if (!team) return [];

  const unpaidBillsData = await db
    .select({
      bill: supplierBills,
      supplier: suppliers,
    })
    .from(supplierBills)
    .leftJoin(suppliers, eq(supplierBills.supplierId, suppliers.id))
    .where(
      and(
        eq(supplierBills.teamId, team.id),
        or(
          eq(supplierBills.paymentStatus, 'unpaid'),
          eq(supplierBills.paymentStatus, 'partial')
        )
      )
    )
    .orderBy(desc(supplierBills.billDate));

  const today = new Date();
  const results: UnpaidBill[] = unpaidBillsData.map(({ bill, supplier }) => {
    let daysOverdue = null;
    if (bill.dueDate) {
      const due = new Date(bill.dueDate);
      if (due < today) {
        daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    return {
      id: bill.id,
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      dueDate: bill.dueDate,
      supplierName: supplier?.name || 'N/A',
      supplierEmail: supplier?.email || null,
      totalAmount: bill.totalAmount,
      amountPaid: bill.amountPaid,
      amountDue: bill.amountDue,
      currency: bill.currency,
      paymentStatus: bill.paymentStatus,
      daysOverdue,
    };
  });

  return results;
}

/**
 * Calculate summary statistics for unpaid bills
 */
export async function getUnpaidBillsSummary(): Promise<UnpaidBillsSummary> {
  const unpaidBills = await getUnpaidBills();

  let totalUnpaid = new Decimal(0);
  let totalOverdue = new Decimal(0);
  let overdueCount = 0;
  let totalDaysOverdue = 0;

  for (const bill of unpaidBills) {
    totalUnpaid = totalUnpaid.plus(bill.amountDue);

    if (bill.daysOverdue !== null && bill.daysOverdue > 0) {
      totalOverdue = totalOverdue.plus(bill.amountDue);
      overdueCount++;
      totalDaysOverdue += bill.daysOverdue;
    }
  }

  const averageDaysOverdue = overdueCount > 0 ? Math.round(totalDaysOverdue / overdueCount) : 0;

  return {
    totalUnpaid: totalUnpaid.toFixed(2),
    totalOverdue: totalOverdue.toFixed(2),
    unpaidCount: unpaidBills.length,
    overdueCount,
    averageDaysOverdue,
  };
}
