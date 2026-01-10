import { db } from '@/lib/db/drizzle';
import { supplierPayments, supplierBills, suppliers, paymentMethods, supplierPaymentAllocations } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, desc, ne, or } from 'drizzle-orm';

/**
 * Get all payments for a specific supplier bill
 */
export async function getSupplierBillPayments(billId: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  try {
    const results = await db
      .select({
        id: supplierPayments.id,
        amount: supplierPayments.amount,
        currency: supplierPayments.currency,
        paymentDate: supplierPayments.paymentDate,
        paymentMethod: supplierPayments.paymentMethod,
        paymentMethodName: paymentMethods.name,
        paymentGateway: supplierPayments.paymentGateway,
        bankName: supplierPayments.bankName,
        chequeNumber: supplierPayments.chequeNumber,
        transactionId: supplierPayments.transactionId,
        receiptNumber: supplierPayments.receiptNumber,
        notes: supplierPayments.notes,
        createdAt: supplierPayments.createdAt,
      })
      .from(supplierPayments)
      .leftJoin(
        paymentMethods,
        and(
          eq(paymentMethods.code, supplierPayments.paymentMethod),
          eq(paymentMethods.teamId, team.id)
        )
      )
      .where(
        and(
          eq(supplierPayments.billId, billId),
          eq(supplierPayments.teamId, team.id)
        )
      )
      .orderBy(desc(supplierPayments.paymentDate));

    return results || [];
  } catch (error) {
    console.error('Error in getSupplierBillPayments:', error);
    return [];
  }
}

/**
 * Get all supplier payments for the current team
 */
export async function getSupplierPayments() {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select({
      payment: {
        id: supplierPayments.id,
        amount: supplierPayments.amount,
        currency: supplierPayments.currency,
        paymentDate: supplierPayments.paymentDate,
        paymentMethod: supplierPayments.paymentMethod,
        receiptNumber: supplierPayments.receiptNumber,
        createdAt: supplierPayments.createdAt,
      },
      bill: {
        id: supplierBills.id,
        billNumber: supplierBills.billNumber,
      },
      supplier: {
        id: suppliers.id,
        name: suppliers.name,
      },
    })
    .from(supplierPayments)
    .innerJoin(supplierBills, eq(supplierPayments.billId, supplierBills.id))
    .innerJoin(suppliers, eq(supplierBills.supplierId, suppliers.id))
    .where(eq(supplierPayments.teamId, team.id))
    .orderBy(desc(supplierPayments.paymentDate));

  return results;
}

/**
 * Get a single supplier payment by ID
 */
export async function getSupplierPaymentById(id: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [payment] = await db
    .select()
    .from(supplierPayments)
    .where(
      and(eq(supplierPayments.id, id), eq(supplierPayments.teamId, team.id))
    )
    .limit(1);

  return payment || null;
}

// ============================================================
// SUPPLIER ADVANCES QUERIES
// ============================================================

/**
 * Get all supplier advances (payments with type='advance')
 */
export async function getSupplierAdvances(supplierId?: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [
    eq(supplierPayments.teamId, team.id),
    eq(supplierPayments.paymentType, 'advance'),
  ];

  if (supplierId) {
    // Note: We need to join with supplierBills to get supplierId
    // For advances, we may not have a billId, so we need a different approach
    // For now, we'll query all advances and filter in memory if needed
  }

  const results = await db
    .select({
      id: supplierPayments.id,
      advanceNumber: supplierPayments.advanceNumber,
      amount: supplierPayments.amount,
      allocatedAmount: supplierPayments.allocatedAmount,
      unallocatedAmount: supplierPayments.unallocatedAmount,
      currency: supplierPayments.currency,
      paymentDate: supplierPayments.paymentDate,
      paymentMethod: supplierPayments.paymentMethod,
      paymentMethodName: paymentMethods.name,
      paymentGateway: supplierPayments.paymentGateway,
      transactionId: supplierPayments.transactionId,
      bankName: supplierPayments.bankName,
      chequeNumber: supplierPayments.chequeNumber,
      notes: supplierPayments.notes,
      createdAt: supplierPayments.createdAt,
    })
    .from(supplierPayments)
    .leftJoin(
      paymentMethods,
      and(
        eq(paymentMethods.code, supplierPayments.paymentMethod),
        eq(paymentMethods.teamId, team.id)
      )
    )
    .where(and(...conditions))
    .orderBy(desc(supplierPayments.paymentDate));

  return results;
}

/**
 * Get a single supplier advance with full details including allocations
 */
export async function getSupplierAdvanceById(advanceId: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [advance] = await db
    .select({
      id: supplierPayments.id,
      advanceNumber: supplierPayments.advanceNumber,
      amount: supplierPayments.amount,
      allocatedAmount: supplierPayments.allocatedAmount,
      unallocatedAmount: supplierPayments.unallocatedAmount,
      currency: supplierPayments.currency,
      paymentDate: supplierPayments.paymentDate,
      paymentMethod: supplierPayments.paymentMethod,
      paymentMethodName: paymentMethods.name,
      paymentGateway: supplierPayments.paymentGateway,
      transactionId: supplierPayments.transactionId,
      bankName: supplierPayments.bankName,
      chequeNumber: supplierPayments.chequeNumber,
      notes: supplierPayments.notes,
      createdAt: supplierPayments.createdAt,
    })
    .from(supplierPayments)
    .leftJoin(
      paymentMethods,
      and(
        eq(paymentMethods.code, supplierPayments.paymentMethod),
        eq(paymentMethods.teamId, team.id)
      )
    )
    .where(
      and(
        eq(supplierPayments.id, advanceId),
        eq(supplierPayments.teamId, team.id),
        eq(supplierPayments.paymentType, 'advance')
      )
    );

  if (!advance) return null;

  // Get allocations
  const allocations = await db
    .select({
      id: supplierPaymentAllocations.id,
      bill: supplierBills,
      allocatedAmount: supplierPaymentAllocations.allocatedAmount,
      createdAt: supplierPaymentAllocations.createdAt,
    })
    .from(supplierPaymentAllocations)
    .leftJoin(supplierBills, eq(supplierPaymentAllocations.billId, supplierBills.id))
    .where(eq(supplierPaymentAllocations.supplierPaymentId, advanceId));

  return {
    ...advance,
    allocations,
  };
}

/**
 * Get supplier advances with unallocated balance
 */
export async function getSupplierUnallocatedAdvances(supplierId?: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [
    eq(supplierPayments.teamId, team.id),
    eq(supplierPayments.paymentType, 'advance'),
    ne(supplierPayments.unallocatedAmount, '0.00'),
  ];

  const results = await db
    .select({
      id: supplierPayments.id,
      advanceNumber: supplierPayments.advanceNumber,
      amount: supplierPayments.amount,
      allocatedAmount: supplierPayments.allocatedAmount,
      unallocatedAmount: supplierPayments.unallocatedAmount,
      currency: supplierPayments.currency,
      paymentDate: supplierPayments.paymentDate,
    })
    .from(supplierPayments)
    .where(and(...conditions))
    .orderBy(desc(supplierPayments.paymentDate));

  return results;
}

/**
 * Get outstanding bills for a supplier
 */
export async function getSupplierOutstandingBills(supplierId: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select({
      id: supplierBills.id,
      billNumber: supplierBills.billNumber,
      billDate: supplierBills.billDate,
      dueDate: supplierBills.dueDate,
      totalAmount: supplierBills.totalAmount,
      amountPaid: supplierBills.amountPaid,
      amountDue: supplierBills.amountDue,
      currency: supplierBills.currency,
      status: supplierBills.status,
      paymentStatus: supplierBills.paymentStatus,
    })
    .from(supplierBills)
    .where(
      and(
        eq(supplierBills.teamId, team.id),
        eq(supplierBills.supplierId, supplierId),
        or(
          eq(supplierBills.paymentStatus, 'unpaid'),
          eq(supplierBills.paymentStatus, 'partial')
        ),
        ne(supplierBills.status, 'cancelled')
      )
    )
    .orderBy(desc(supplierBills.billDate));

  return results;
}
