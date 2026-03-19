import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Search, FileText, Eye, Edit, Plane, Users, DollarSign, BarChart3, Download, PieChart } from 'lucide-react';
import { getTourInvoices, getTourInvoiceStats } from '@/lib/db/tour-invoice-queries';
import { Badge } from '@/components/ui/badge';

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    sent: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    viewed: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
    partial: 'bg-amber-100 text-amber-900 hover:bg-amber-100',
    paid: 'bg-green-100 text-green-700 hover:bg-green-100',
    overdue: 'bg-red-100 text-red-700 hover:bg-red-100',
    cancelled: 'bg-gray-100 text-gray-500 hover:bg-gray-100',
  };
  return (
    <Badge variant="outline" className={styles[status] || ''}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

async function StatsCards() {
  const stats = await getTourInvoiceStats();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <Link href="/tour-invoices">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2"><FileText className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Invoices</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      <Link href="/tour-invoices?status=paid">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2"><DollarSign className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">USD {parseFloat(stats.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      <Link href="/tour-invoices/reports">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2"><BarChart3 className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-sm text-gray-500">SDF Collected</p>
                <p className="text-2xl font-bold">USD {parseFloat(stats.totalSdf).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      <Link href="/tour-invoices?status=sent">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2"><DollarSign className="h-5 w-5 text-amber-800" /></div>
              <div>
                <p className="text-sm text-gray-500">Outstanding</p>
                <p className="text-2xl font-bold">USD {parseFloat(stats.outstanding).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

async function TourInvoiceList({
  searchTerm,
  status,
}: {
  searchTerm?: string;
  status?: string;
}) {
  const { invoices } = await getTourInvoices({ searchTerm, status });

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <Plane className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tour invoices yet</h3>
        <p className="text-gray-500 mb-4">Create your first tour invoice to get started</p>
        <Link href="/tour-invoices/new">
          <Button className="bg-amber-500 hover:bg-amber-800">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Tour Invoice
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Tour Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-center">Guests</TableHead>
              <TableHead className="text-right">Grand Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(({ tourInvoice, customer }) => (
              <TableRow key={tourInvoice.id}>
                <TableCell className="font-medium">{tourInvoice.invoiceNumber}</TableCell>
                <TableCell>{tourInvoice.tourName}</TableCell>
                <TableCell>{customer?.name || 'N/A'}</TableCell>
                <TableCell>
                  {tourInvoice.arrivalDate
                    ? new Date(tourInvoice.arrivalDate).toLocaleDateString()
                    : '-'}
                  {tourInvoice.departureDate && (
                    <> → {new Date(tourInvoice.departureDate).toLocaleDateString()}</>
                  )}
                  {tourInvoice.numberOfNights != null && (
                    <span className="text-gray-500 ml-1">({tourInvoice.numberOfNights}N)</span>
                  )}
                </TableCell>
                <TableCell className="text-center">{tourInvoice.numberOfGuests}</TableCell>
                <TableCell className="text-right font-medium">
                  {tourInvoice.currency} {parseFloat(tourInvoice.grandTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>{statusBadge(tourInvoice.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/tour-invoices/${tourInvoice.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    </Link>
                    {tourInvoice.status === 'draft' && (
                      <Link href={`/tour-invoices/${tourInvoice.id}/edit`}>
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function TourInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">Tour Invoices</h1>
          <p className="text-sm text-gray-500">Manage tour packages and SDF billing</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/tour-invoices/reports">
            <Button variant="outline">
              <PieChart className="mr-2 h-4 w-4" />
              Reports
            </Button>
          </Link>
          <a href="/api/tour-invoices/export" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </a>
          <Link href="/tour-invoices/new">
            <Button className="bg-amber-500 hover:bg-amber-800">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Tour Invoice
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}</div>}>
        <StatsCards />
      </Suspense>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form action="/tour-invoices" method="get" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search by invoice #, tour name, or customer..."
                  defaultValue={params.search}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <select
                name="status"
                defaultValue={params.status || ''}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button type="submit" variant="outline">Apply</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
        <TourInvoiceList searchTerm={params.search} status={params.status} />
      </Suspense>
    </section>
  );
}
