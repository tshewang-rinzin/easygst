import { db } from '@/lib/db/drizzle';
import { expenses, expenseCategories, suppliers } from '@/lib/db/schema';
import { eq, and, gte, lte, like, sql, desc, ilike, or } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

export async function getExpenses(filters?: {
  categoryId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [eq(expenses.teamId, team.id)];

  if (filters?.categoryId) {
    conditions.push(eq(expenses.expenseCategoryId, filters.categoryId));
  }
  if (filters?.status) {
    conditions.push(eq(expenses.status, filters.status));
  }
  if (filters?.startDate) {
    conditions.push(gte(expenses.expenseDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(expenses.expenseDate, filters.endDate));
  }
  if (filters?.search) {
    conditions.push(
      or(
        ilike(expenses.description, `%${filters.search}%`),
        ilike(expenses.expenseNumber, `%${filters.search}%`),
        ilike(expenses.referenceNumber, `%${filters.search}%`)
      )!
    );
  }

  return db
    .select({
      id: expenses.id,
      expenseNumber: expenses.expenseNumber,
      expenseDate: expenses.expenseDate,
      description: expenses.description,
      referenceNumber: expenses.referenceNumber,
      amount: expenses.amount,
      gstRate: expenses.gstRate,
      gstAmount: expenses.gstAmount,
      totalAmount: expenses.totalAmount,
      claimableGstAmount: expenses.claimableGstAmount,
      status: expenses.status,
      isPaid: expenses.isPaid,
      paymentMethod: expenses.paymentMethod,
      categoryName: expenseCategories.name,
      categoryCode: expenseCategories.code,
      supplierName: suppliers.name,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
    .leftJoin(suppliers, eq(expenses.supplierId, suppliers.id))
    .where(and(...conditions))
    .orderBy(desc(expenses.expenseDate));
}

export async function getExpenseById(id: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const result = await db
    .select({
      id: expenses.id,
      teamId: expenses.teamId,
      expenseCategoryId: expenses.expenseCategoryId,
      supplierId: expenses.supplierId,
      expenseNumber: expenses.expenseNumber,
      expenseDate: expenses.expenseDate,
      description: expenses.description,
      referenceNumber: expenses.referenceNumber,
      currency: expenses.currency,
      amount: expenses.amount,
      gstRate: expenses.gstRate,
      gstAmount: expenses.gstAmount,
      totalAmount: expenses.totalAmount,
      claimableGstAmount: expenses.claimableGstAmount,
      paymentMethod: expenses.paymentMethod,
      paymentDate: expenses.paymentDate,
      isPaid: expenses.isPaid,
      paidFromAccount: expenses.paidFromAccount,
      isRecurring: expenses.isRecurring,
      recurringFrequency: expenses.recurringFrequency,
      status: expenses.status,
      approvedBy: expenses.approvedBy,
      approvedAt: expenses.approvedAt,
      notes: expenses.notes,
      fiscalYear: expenses.fiscalYear,
      fiscalMonth: expenses.fiscalMonth,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      createdBy: expenses.createdBy,
      categoryName: expenseCategories.name,
      categoryCode: expenseCategories.code,
      gstClaimable: expenseCategories.gstClaimable,
      supplierName: suppliers.name,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
    .leftJoin(suppliers, eq(expenses.supplierId, suppliers.id))
    .where(and(eq(expenses.id, id), eq(expenses.teamId, team.id)));

  return result[0] || null;
}

export async function getExpenseCategories(activeOnly = true) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [eq(expenseCategories.teamId, team.id)];
  if (activeOnly) {
    conditions.push(eq(expenseCategories.isActive, true));
  }

  return db
    .select()
    .from(expenseCategories)
    .where(and(...conditions))
    .orderBy(expenseCategories.name);
}

export async function getExpenseSummary(startDate: Date, endDate: Date) {
  const team = await getTeamForUser();
  if (!team) return [];

  return db
    .select({
      categoryName: expenseCategories.name,
      categoryCode: expenseCategories.code,
      totalAmount: sql<string>`sum(${expenses.totalAmount})`,
      totalGst: sql<string>`sum(${expenses.gstAmount})`,
      totalClaimableGst: sql<string>`sum(${expenses.claimableGstAmount})`,
      count: sql<number>`count(*)`,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.expenseCategoryId, expenseCategories.id))
    .where(
      and(
        eq(expenses.teamId, team.id),
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate),
        sql`${expenses.status} != 'void'`
      )
    )
    .groupBy(expenseCategories.name, expenseCategories.code);
}

export async function getClaimableGstTotal(startDate: Date, endDate: Date) {
  const team = await getTeamForUser();
  if (!team) return { total: '0' };

  const result = await db
    .select({
      total: sql<string>`coalesce(sum(${expenses.claimableGstAmount}), 0)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.teamId, team.id),
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate),
        sql`${expenses.status} != 'void'`
      )
    );

  return result[0] || { total: '0' };
}
