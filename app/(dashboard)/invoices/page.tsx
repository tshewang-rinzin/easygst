import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, FileText } from 'lucide-react';
import { getInvoices } from '@/lib/invoices/queries';

async function InvoiceList({
  searchTerm,
  status,
}: {
  searchTerm?: string;
  status?: string;
}) {
  const invoices = await getInvoices({ searchTerm, status });

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No invoices yet
        </h3>
        <p className="text-gray-500 mb-4">
          Get started by creating your first invoice
        </p>
        <Link href="/invoices/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map(({ invoice, customer }) => (
        <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {invoice.invoiceNumber}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'sent'
                          ? 'bg-blue-100 text-blue-700'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : invoice.status === 'draft'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {invoice.status.charAt(0).toUpperCase() +
                        invoice.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Customer: {customer?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Date: {new Date(invoice.invoiceDate).toLocaleDateString()}
                    {invoice.dueDate &&
                      ` • Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p className="text-xl font-bold text-gray-900">
                    {invoice.currency} {parseFloat(invoice.totalAmount).toFixed(2)}
                  </p>
                  {parseFloat(invoice.amountDue) > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Due: {invoice.currency}{' '}
                      {parseFloat(invoice.amountDue).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function InvoiceListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const searchTerm = params.search;
  const status = params.status;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Invoices
          </h1>
          <p className="text-sm text-gray-500">
            Manage and track your invoices
          </p>
        </div>
        <Link href="/invoices/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form action="/invoices" method="get" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search by invoice number or customer..."
                  defaultValue={searchTerm}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Status Filter */}
              <select
                name="status"
                defaultValue={status || ''}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <Button type="submit" variant="outline">
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Suspense fallback={<InvoiceListSkeleton />}>
        <InvoiceList searchTerm={searchTerm} status={status} />
      </Suspense>
    </section>
  );
}
