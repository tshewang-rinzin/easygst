import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPayments } from '@/lib/payments/queries';
import { Trash2, FileText } from 'lucide-react';

async function PaymentsList() {
  const payments = await getPayments();

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 mb-4">No payments recorded yet.</p>
          <p className="text-sm text-gray-400">
            Payments will appear here when you record them on invoices.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
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
                  Method
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Adjustment
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Reference
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map(({ payment, invoice, customer }) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">
                    {new Date(payment.paymentDate).toLocaleDateString('en-GB', {
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
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      {payment.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-semibold">
                    {payment.currency} {parseFloat(payment.amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    {parseFloat(payment.adjustmentAmount || '0') !== 0 ? (
                      <div className="flex flex-col items-end">
                        <span className={`font-medium ${
                          parseFloat(payment.adjustmentAmount || '0') < 0
                            ? 'text-green-600'
                            : 'text-orange-600'
                        }`}>
                          {parseFloat(payment.adjustmentAmount || '0') > 0 ? '+' : ''}
                          {payment.currency} {parseFloat(payment.adjustmentAmount || '0').toFixed(2)}
                        </span>
                        {payment.adjustmentReason && (
                          <span className="text-xs text-gray-500">
                            {payment.adjustmentReason.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {payment.transactionId || payment.receiptNumber || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link href={`/invoices/${invoice?.id}`}>
                      <Button variant="ghost" size="sm">
                        View Invoice
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Total Payments:{' '}
                <span className="font-semibold text-gray-900">
                  {payments.length}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Total Amount:{' '}
                <span className="font-semibold text-gray-900">
                  BTN{' '}
                  {payments
                    .reduce((sum, { payment }) =>
                      sum + parseFloat(payment.amount) + parseFloat(payment.adjustmentAmount || '0'), 0)
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

export default function PaymentsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Payments</h1>
        <p className="text-sm text-gray-600">
          View all payment records and transaction history
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Loading payments...</p>
            </CardContent>
          </Card>
        }
      >
        <PaymentsList />
      </Suspense>
    </section>
  );
}
