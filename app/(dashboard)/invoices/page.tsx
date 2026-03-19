import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Search, FileText } from 'lucide-react';
import { getInvoices } from '@/lib/invoices/queries';
import { InvoiceTable } from '@/components/invoices/invoice-table';

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
          <Button className="bg-amber-500 hover:bg-amber-800">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </Link>
      </div>
    );
  }

  return <InvoiceTable invoices={invoices} />;
}

function InvoiceListSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Amount Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-8 bg-gray-200 rounded w-16 ml-auto"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
          <Button className="bg-amber-500 hover:bg-amber-800">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Status Filter */}
              <select
                name="status"
                defaultValue={status || ''}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
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
