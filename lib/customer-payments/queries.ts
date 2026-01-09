import { db } from '@/lib/db/drizzle';
import {
  customerPayments,
  paymentAllocations,
  invoices,
  customers,
  paymentMethods
} from '@/lib/db/schema';
import { eq, and, desc, or, ne } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all unpaid/partially paid invoices for a customer
 */
export async function getCustomerOutstandingInvoices(customerId: number) {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      totalAmount: invoices.totalAmount,
      amountPaid: invoices.amountPaid,
      amountDue: invoices.amountDue,
      currency: invoices.currency,
      status: invoices.status,
      paymentStatus: invoices.paymentStatus,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, team.id),
        eq(invoices.customerId, customerId),
        or(
          eq(invoices.paymentStatus, 'unpaid'),
          eq(invoices.paymentStatus, 'partial')
        ),
        ne(invoices.status, 'cancelled')
      )
    )
    .orderBy(desc(invoices.invoiceDate));

  return results;
}

/**
 * Get all customer payments with their allocations
 */
export async function getCustomerPayments(customerId?: number) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [eq(customerPayments.teamId, team.id)];

  if (customerId) {
    conditions.push(eq(customerPayments.customerId, customerId));
  }

  const results = await db
    .select({
      id: customerPayments.id,
      customer: customers,
      amount: customerPayments.amount,
      allocatedAmount: customerPayments.allocatedAmount,
      unallocatedAmount: customerPayments.unallocatedAmount,
      currency: customerPayments.currency,
      paymentDate: customerPayments.paymentDate,
      paymentMethod: customerPayments.paymentMethod,
      paymentMethodName: paymentMethods.name,
      paymentGateway: customerPayments.paymentGateway,
      transactionId: customerPayments.transactionId,
      bankName: customerPayments.bankName,
      chequeNumber: customerPayments.chequeNumber,
      receiptNumber: customerPayments.receiptNumber,
      notes: customerPayments.notes,
      createdAt: customerPayments.createdAt,
    })
    .from(customerPayments)
    .leftJoin(customers, eq(customerPayments.customerId, customers.id))
    .leftJoin(
      paymentMethods,
      and(
        eq(paymentMethods.code, customerPayments.paymentMethod),
        eq(paymentMethods.teamId, team.id)
      )
    )
    .where(and(...conditions))
    .orderBy(desc(customerPayments.paymentDate));

  return results;
}

/**
 * Get a single customer payment with full details including allocations
 */
export async function getCustomerPaymentWithDetails(paymentId: number) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [payment] = await db
    .select({
      id: customerPayments.id,
      customer: customers,
      amount: customerPayments.amount,
      allocatedAmount: customerPayments.allocatedAmount,
      unallocatedAmount: customerPayments.unallocatedAmount,
      currency: customerPayments.currency,
      paymentDate: customerPayments.paymentDate,
      paymentMethod: customerPayments.paymentMethod,
      paymentMethodName: paymentMethods.name,
      paymentGateway: customerPayments.paymentGateway,
      transactionId: customerPayments.transactionId,
      bankName: customerPayments.bankName,
      chequeNumber: customerPayments.chequeNumber,
      receiptNumber: customerPayments.receiptNumber,
      notes: customerPayments.notes,
      createdAt: customerPayments.createdAt,
    })
    .from(customerPayments)
    .leftJoin(customers, eq(customerPayments.customerId, customers.id))
    .leftJoin(
      paymentMethods,
      and(
        eq(paymentMethods.code, customerPayments.paymentMethod),
        eq(paymentMethods.teamId, team.id)
      )
    )
    .where(
      and(
        eq(customerPayments.id, paymentId),
        eq(customerPayments.teamId, team.id)
      )
    );

  if (!payment) return null;

  // Get allocations
  const allocations = await db
    .select({
      id: paymentAllocations.id,
      invoice: invoices,
      allocatedAmount: paymentAllocations.allocatedAmount,
      createdAt: paymentAllocations.createdAt,
    })
    .from(paymentAllocations)
    .leftJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
    .where(eq(paymentAllocations.customerPaymentId, paymentId));

  return {
    ...payment,
    allocations,
  };
}

// ============================================================
// CUSTOMER ADVANCES QUERIES
// ============================================================

/**
 * Get all customer advances (payments with type='advance')
 */
export async function getCustomerAdvances(customerId?: number) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [
    eq(customerPayments.teamId, team.id),
    eq(customerPayments.paymentType, 'advance'),
  ];

  if (customerId) {
    conditions.push(eq(customerPayments.customerId, customerId));
  }

  const results = await db
    .select({
      id: customerPayments.id,
      customer: customers,
      advanceNumber: customerPayments.advanceNumber,
      amount: customerPayments.amount,
      allocatedAmount: customerPayments.allocatedAmount,
      unallocatedAmount: customerPayments.unallocatedAmount,
      currency: customerPayments.currency,
      paymentDate: customerPayments.paymentDate,
      paymentMethod: customerPayments.paymentMethod,
      paymentMethodName: paymentMethods.name,
      paymentGateway: customerPayments.paymentGateway,
      transactionId: customerPayments.transactionId,
      bankName: customerPayments.bankName,
      chequeNumber: customerPayments.chequeNumber,
      notes: customerPayments.notes,
      createdAt: customerPayments.createdAt,
    })
    .from(customerPayments)
    .leftJoin(customers, eq(customerPayments.customerId, customers.id))
    .leftJoin(
      paymentMethods,
      and(
        eq(paymentMethods.code, customerPayments.paymentMethod),
        eq(paymentMethods.teamId, team.id)
      )
    )
    .where(and(...conditions))
    .orderBy(desc(customerPayments.paymentDate));

  return results;
}

/**
 * Get a single customer advance with full details including allocations
 */
export async function getCustomerAdvanceById(advanceId: number) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [advance] = await db
    .select({
      id: customerPayments.id,
      customer: customers,
      advanceNumber: customerPayments.advanceNumber,
      amount: customerPayments.amount,
      allocatedAmount: customerPayments.allocatedAmount,
      unallocatedAmount: customerPayments.unallocatedAmount,
      currency: customerPayments.currency,
      paymentDate: customerPayments.paymentDate,
      paymentMethod: customerPayments.paymentMethod,
      paymentMethodName: paymentMethods.name,
      paymentGateway: customerPayments.paymentGateway,
      transactionId: customerPayments.transactionId,
      bankName: customerPayments.bankName,
      chequeNumber: customerPayments.chequeNumber,
      notes: customerPayments.notes,
      createdAt: customerPayments.createdAt,
    })
    .from(customerPayments)
    .leftJoin(customers, eq(customerPayments.customerId, customers.id))
    .leftJoin(
      paymentMethods,
      and(
        eq(paymentMethods.code, customerPayments.paymentMethod),
        eq(paymentMethods.teamId, team.id)
      )
    )
    .where(
      and(
        eq(customerPayments.id, advanceId),
        eq(customerPayments.teamId, team.id),
        eq(customerPayments.paymentType, 'advance')
      )
    );

  if (!advance) return null;

  // Get allocations
  const allocations = await db
    .select({
      id: paymentAllocations.id,
      invoice: invoices,
      allocatedAmount: paymentAllocations.allocatedAmount,
      createdAt: paymentAllocations.createdAt,
    })
    .from(paymentAllocations)
    .leftJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
    .where(eq(paymentAllocations.customerPaymentId, advanceId));

  return {
    ...advance,
    allocations,
  };
}

/**
 * Get customer advances with unallocated balance
 */
export async function getCustomerUnallocatedAdvances(customerId: number) {
  const team = await getTeamForUser();
  if (!team) return [];

  const results = await db
    .select({
      id: customerPayments.id,
      advanceNumber: customerPayments.advanceNumber,
      amount: customerPayments.amount,
      allocatedAmount: customerPayments.allocatedAmount,
      unallocatedAmount: customerPayments.unallocatedAmount,
      currency: customerPayments.currency,
      paymentDate: customerPayments.paymentDate,
    })
    .from(customerPayments)
    .where(
      and(
        eq(customerPayments.teamId, team.id),
        eq(customerPayments.customerId, customerId),
        eq(customerPayments.paymentType, 'advance'),
        ne(customerPayments.unallocatedAmount, '0.00')
      )
    )
    .orderBy(desc(customerPayments.paymentDate));

  return results;
}
