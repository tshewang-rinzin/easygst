import { db } from '@/lib/db/drizzle';
import { supplierBillAdjustments, supplierBills, suppliers } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';

/**
 * Get all bill adjustments with bill and supplier details
 */
export async function getBillAdjustments() {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select({
      adjustment: supplierBillAdjustments,
      bill: supplierBills,
      supplier: suppliers,
    })
    .from(supplierBillAdjustments)
    .leftJoin(supplierBills, eq(supplierBillAdjustments.billId, supplierBills.id))
    .leftJoin(suppliers, eq(supplierBills.supplierId, suppliers.id))
    .where(eq(supplierBillAdjustments.teamId, team.id))
    .orderBy(desc(supplierBillAdjustments.adjustmentDate));

  return results;
}

/**
 * Get adjustments for a specific bill
 */
export async function getBillAdjustmentsByBillId(billId: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select()
    .from(supplierBillAdjustments)
    .where(eq(supplierBillAdjustments.billId, billId))
    .orderBy(desc(supplierBillAdjustments.adjustmentDate));

  return results;
}

/**
 * Get recent bill adjustments (last 10)
 */
export async function getRecentBillAdjustments() {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select({
      adjustment: supplierBillAdjustments,
      bill: supplierBills,
      supplier: suppliers,
    })
    .from(supplierBillAdjustments)
    .leftJoin(supplierBills, eq(supplierBillAdjustments.billId, supplierBills.id))
    .leftJoin(suppliers, eq(supplierBills.supplierId, suppliers.id))
    .where(eq(supplierBillAdjustments.teamId, team.id))
    .orderBy(desc(supplierBillAdjustments.adjustmentDate))
    .limit(10);

  return results;
}
