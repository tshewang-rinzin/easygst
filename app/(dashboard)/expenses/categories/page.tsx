import { getExpenseCategories } from '@/lib/expenses/queries';
import { CategoriesManager } from './categories-manager';

export default async function ExpenseCategoriesPage() {
  const categories = await getExpenseCategories(false);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Expense Categories</h1>
      <CategoriesManager categories={categories} />
    </section>
  );
}
