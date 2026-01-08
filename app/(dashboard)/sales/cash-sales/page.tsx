import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCashSales } from '@/lib/invoices/cash-sales-queries';
import { Banknote, PlusCircle, Download } from 'lucide-react';

async function CashSalesList() {
  const sales = await getCashSales();

  if (sales.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Banknote className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No cash sales recorded yet.</p>
          <p className="text-sm text-gray-400 mb-6">
            Cash sales are recorded when you receive payment immediately at the time of sale.
          </p>
          <Link href="/sales/cash-sales/new">
            <Button className="bg-green-600 hover:bg-green-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Record Cash Sale
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary
  const totalSales = sales.reduce(
    (sum, { invoice }) => sum + parseFloat(invoice.totalAmount),
    0
  );
  const totalTax = sales.reduce(
    (sum, { invoice }) => sum + parseFloat(invoice.totalTax),
    0
  );

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cash Sales</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
              <Banknote className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  BTN {totalSales.toFixed(2)}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total GST Collected</p>
                <p className="text-2xl font-bold text-orange-600">
                  BTN {totalTax.toFixed(2)}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Sales History</CardTitle>
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
                    Invoice #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Payment Method
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    GST
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map(({ invoice, customer }) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(invoice.invoiceDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {customer?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        Cash Sale
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                      {invoice.currency} {parseFloat(invoice.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600">
                      {invoice.currency} {parseFloat(invoice.totalTax).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Paid
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <a href={`/api/invoices/${invoice.id}/pdf`} download>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function CashSalesListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
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
    </div>
  );
}

export default function CashSalesPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Banknote className="h-8 w-8 text-green-600" />
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
              Cash Sales
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Sales with immediate payment (Invoice-cum-Receipt)
          </p>
        </div>
        <Link href="/sales/cash-sales/new">
          <Button className="bg-green-600 hover:bg-green-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            Record Cash Sale
          </Button>
        </Link>
      </div>

      <Suspense fallback={<CashSalesListSkeleton />}>
        <CashSalesList />
      </Suspense>
    </section>
  );
}
