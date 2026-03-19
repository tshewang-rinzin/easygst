import { notFound, redirect } from 'next/navigation';
import { getExpenseById, getExpenseCategories } from '@/lib/expenses/queries';
import { getSuppliers } from '@/lib/suppliers/queries';
import { ExpenseForm } from '../../expense-form';

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [expense, categories, suppliers] = await Promise.all([
    getExpenseById(id),
    getExpenseCategories(),
    getSuppliers(),
  ]);

  if (!expense) notFound();
  if (expense.status !== 'draft') redirect(`/expenses/${id}`);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Expense — {expense.expenseNumber}</h1>
      <ExpenseForm
        categories={categories}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        expense={{
          id: expense.id,
          expenseCategoryId: expense.expenseCategoryId,
          supplierId: expense.supplierId,
          expenseDate: expense.expenseDate,
          description: expense.description,
          referenceNumber: expense.referenceNumber,
          currency: expense.currency,
          amount: expense.amount,
          gstRate: expense.gstRate,
          paymentMethod: expense.paymentMethod,
          paymentDate: expense.paymentDate,
          isPaid: expense.isPaid,
          paidFromAccount: expense.paidFromAccount,
          isRecurring: expense.isRecurring,
          recurringFrequency: expense.recurringFrequency,
          notes: expense.notes,
        }}
      />
    </section>
  );
}
