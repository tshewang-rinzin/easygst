import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdjustments } from '@/lib/adjustments/queries';
import { FileText, PlusCircle, Trash2 } from 'lucide-react';
import { DeleteAdjustmentDialog } from '@/components/adjustments/delete-adjustment-dialog';

async function AdjustmentsList() {
  const adjustments = await getAdjustments();

  if (adjustments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 mb-4">No adjustments recorded yet.</p>
          <p className="text-sm text-gray-400 mb-6">
            Adjustments allow you to add discounts, late fees, or other charges to invoices.
          </p>
          <Link href="/adjustments/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Adjustment
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Adjustments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Invoice
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Description
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map(({ adjustment, invoice, customer }) => {
                const amount = parseFloat(adjustment.amount);
                const isNegative = amount < 0;

                return (
                  <tr key={adjustment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(adjustment.adjustmentDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Link
                        href={`/invoices/${invoice?.id}`}
                        className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        {invoice?.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {customer?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isNegative
                          ? 'bg-green-50 text-green-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}>
                        {adjustment.adjustmentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {adjustment.description}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`font-semibold ${
                        isNegative ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {isNegative ? '' : '+'}{invoice?.currency} {Math.abs(amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/invoices/${invoice?.id}`}>
                          <Button variant="ghost" size="sm">
                            View Invoice
                          </Button>
                        </Link>
                        <DeleteAdjustmentDialog
                          adjustmentId={adjustment.id}
                          adjustmentType={adjustment.adjustmentType}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Total Adjustments:{' '}
                <span className="font-semibold text-gray-900">
                  {adjustments.length}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Net Adjustment:{' '}
                <span className="font-semibold text-gray-900">
                  BTN{' '}
                  {adjustments
                    .reduce((sum, { adjustment }) => sum + parseFloat(adjustment.amount), 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdjustmentsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdjustmentsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Invoice Adjustments
          </h1>
          <p className="text-sm text-gray-500">
            Manage discounts, late fees, and other invoice adjustments
          </p>
        </div>
        <Link href="/adjustments/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Adjustment
          </Button>
        </Link>
      </div>

      <Suspense fallback={<AdjustmentsListSkeleton />}>
        <AdjustmentsList />
      </Suspense>
    </section>
  );
}
