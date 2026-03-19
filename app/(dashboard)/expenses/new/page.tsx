import { getExpenseCategories } from '@/lib/expenses/queries';
import { getSuppliers } from '@/lib/suppliers/queries';
import { ExpenseForm } from '../expense-form';

export default async function NewExpensePage() {
  const [categories, suppliers] = await Promise.all([
    getExpenseCategories(),
    getSuppliers(),
  ]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">New Expense</h1>
      <ExpenseForm
        categories={categories}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
      />
    </section>
  );
}
