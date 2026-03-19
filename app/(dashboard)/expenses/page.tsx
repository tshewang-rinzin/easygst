import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { ExpensesList } from './expenses-list';
import { getExpenses, getExpenseCategories } from '@/lib/expenses/queries';
import { db } from '@/lib/db/drizzle';
import { expenses } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

async function ExpenseSummaryCards() {
  const team = await getTeamForUser();
  if (!team) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [summary] = await db
    .select({
      totalExpenses: sql<string>`coalesce(sum(case when ${expenses.status} != 'void' then ${expenses.totalAmount} else 0 end), 0)`,
      claimableGst: sql<string>`coalesce(sum(case when ${expenses.status} != 'void' then ${expenses.claimableGstAmount} else 0 end), 0)`,
      pendingCount: sql<number>`count(case when ${expenses.status} = 'draft' then 1 end)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.teamId, team.id),
        gte(expenses.expenseDate, startOfMonth),
        lte(expenses.expenseDate, endOfMonth)
      )
    );

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Expenses (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">BTN {parseFloat(summary?.totalExpenses || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Claimable GST (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">BTN {parseFloat(summary?.claimableGst || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Pending Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{summary?.pendingCount || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const categoryId = typeof params.category === 'string' ? params.category : undefined;
  const status = typeof params.status === 'string' ? params.status : undefined;

  const [expensesList, categories] = await Promise.all([
    getExpenses({ search, categoryId, status }),
    getExpenseCategories(),
  ]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Link href="/expenses/new">
          <Button className="bg-amber-500 hover:bg-amber-800">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-3 mb-6">{[1,2,3].map(i => <Card key={i}><CardContent className="py-8"><div className="h-8 bg-gray-100 animate-pulse rounded" /></CardContent></Card>)}</div>}>
        <ExpenseSummaryCards />
      </Suspense>

      <ExpensesList
        expenses={expensesList}
        categories={categories}
        filters={{ search, categoryId, status }}
      />
    </section>
  );
}
