import { db } from '@/lib/db/drizzle';
import { supplierBills, supplierBillItems, suppliers, products } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, desc, ne } from 'drizzle-orm';

/**
 * Get all supplier bills for the current team
 */
export async function getSupplierBills() {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select({
      bill: supplierBills,
      supplier: suppliers,
    })
    .from(supplierBills)
    .leftJoin(suppliers, eq(supplierBills.supplierId, suppliers.id))
    .where(
      and(
        eq(supplierBills.teamId, team.id),
        ne(supplierBills.status, 'cancelled')
      )
    )
    .orderBy(desc(supplierBills.billDate));

  return results;
}

/**
 * Get a single supplier bill by ID with all details
 */
export async function getSupplierBillById(id: number) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [result] = await db
    .select({
      bill: supplierBills,
      supplier: suppliers,
    })
    .from(supplierBills)
    .leftJoin(suppliers, eq(supplierBills.supplierId, suppliers.id))
    .where(and(eq(supplierBills.id, id), eq(supplierBills.teamId, team.id)))
    .limit(1);

  if (!result) return null;

  // Get bill items
  const items = await db
    .select({
      item: supplierBillItems,
      product: products,
    })
    .from(supplierBillItems)
    .leftJoin(products, eq(supplierBillItems.productId, products.id))
    .where(eq(supplierBillItems.billId, id))
    .orderBy(supplierBillItems.sortOrder);

  return {
    ...result,
    items,
  };
}

/**
 * Get supplier bill count
 */
export async function getSupplierBillCount() {
  const team = await getTeamForUser();
  if (!team) return 0;

  const results = await db
    .select()
    .from(supplierBills)
    .where(
      and(
        eq(supplierBills.teamId, team.id),
        ne(supplierBills.status, 'cancelled')
      )
    );

  return results.length;
}

/**
 * Get unpaid supplier bills
 */
export async function getUnpaidSupplierBills() {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select({
      bill: supplierBills,
      supplier: suppliers,
    })
    .from(supplierBills)
    .leftJoin(suppliers, eq(supplierBills.supplierId, suppliers.id))
    .where(
      and(
        eq(supplierBills.teamId, team.id),
        ne(supplierBills.paymentStatus, 'paid'),
        ne(supplierBills.status, 'cancelled')
      )
    )
    .orderBy(supplierBills.dueDate);

  return results;
}
