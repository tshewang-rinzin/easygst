import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getExpenseById } from '@/lib/expenses/queries';
import { ExpenseActions } from './expense-actions';

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expense = await getExpenseById(id);
  if (!expense) notFound();

  const fmt = (v: string | null) =>
    parseFloat(v || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const statusBadge: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
    claimed: { label: 'Claimed', className: 'bg-blue-100 text-blue-800' },
    void: { label: 'Void', className: 'bg-red-100 text-red-600' },
  };
  const badge = statusBadge[expense.status] || statusBadge.draft;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{expense.expenseNumber}</h1>
          <p className="text-gray-500">{expense.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={badge.className}>{badge.label}</Badge>
          <ExpenseActions id={expense.id} status={expense.status} />
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Category</span>
              <p className="font-medium">{expense.categoryName} ({expense.categoryCode})</p>
            </div>
            <div>
              <span className="text-gray-500">Date</span>
              <p className="font-medium">{new Date(expense.expenseDate).toLocaleDateString('en-IN')}</p>
            </div>
            {expense.referenceNumber && (
              <div>
                <span className="text-gray-500">Reference</span>
                <p className="font-medium">{expense.referenceNumber}</p>
              </div>
            )}
            {expense.supplierName && (
              <div>
                <span className="text-gray-500">Supplier</span>
                <p className="font-medium">{expense.supplierName}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">GST Claimable</span>
              <p className="font-medium capitalize">{expense.gstClaimable}</p>
            </div>
            <div>
              <span className="text-gray-500">Fiscal Period</span>
              <p className="font-medium">{expense.fiscalYear}/{String(expense.fiscalMonth).padStart(2, '0')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Base Amount</span>
                <p className="font-medium">BTN {fmt(expense.amount)}</p>
              </div>
              <div>
                <span className="text-gray-500">GST Rate</span>
                <p className="font-medium">{expense.gstRate}%</p>
              </div>
              <div>
                <span className="text-gray-500">GST Amount</span>
                <p className="font-medium">BTN {fmt(expense.gstAmount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Amount</span>
                <p className="font-bold text-lg">BTN {fmt(expense.totalAmount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Claimable GST</span>
                <p className="font-medium text-green-600">BTN {fmt(expense.claimableGstAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(expense.paymentMethod || expense.isPaid) && (
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              {expense.paymentMethod && (
                <div>
                  <span className="text-gray-500">Method</span>
                  <p className="font-medium capitalize">{expense.paymentMethod.replace('_', ' ')}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Paid</span>
                <p className="font-medium">{expense.isPaid ? 'Yes' : 'No'}</p>
              </div>
              {expense.paymentDate && (
                <div>
                  <span className="text-gray-500">Payment Date</span>
                  <p className="font-medium">{new Date(expense.paymentDate).toLocaleDateString('en-IN')}</p>
                </div>
              )}
              {expense.paidFromAccount && (
                <div>
                  <span className="text-gray-500">Paid From</span>
                  <p className="font-medium">{expense.paidFromAccount}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {expense.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{expense.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
