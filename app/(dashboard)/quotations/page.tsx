import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FeaturePageGate } from '@/components/feature-page-gate';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Search, FileText, Eye, Edit } from 'lucide-react';
import { getQuotations } from '@/lib/quotations/queries';
import { Badge } from '@/components/ui/badge';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  sent: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  accepted: 'bg-green-100 text-green-700 hover:bg-green-100',
  rejected: 'bg-red-100 text-red-700 hover:bg-red-100',
  expired: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  converted: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
};

async function QuotationList({
  searchTerm,
  status,
}: {
  searchTerm?: string;
  status?: string;
}) {
  const quotationsList = await getQuotations({ searchTerm, status });

  if (quotationsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No quotations yet
        </h3>
        <p className="text-gray-500 mb-4">
          Get started by creating your first quotation
        </p>
        <Link href="/quotations/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Quotation
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
              <TableHead>Quotation #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotationsList.map(({ quotation, customer }) => (
              <TableRow key={quotation.id}>
                <TableCell className="font-medium">
                  {quotation.quotationNumber}
                </TableCell>
                <TableCell>{customer?.name || 'N/A'}</TableCell>
                <TableCell>
                  {new Date(quotation.quotationDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {quotation.validUntil
                    ? new Date(quotation.validUntil).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {quotation.currency}{' '}
                  {parseFloat(quotation.totalAmount).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={statusColors[quotation.status] || ''}
                  >
                    {quotation.status.charAt(0).toUpperCase() +
                      quotation.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/quotations/${quotation.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {['draft', 'sent'].includes(quotation.status) && (
                      <Link href={`/quotations/${quotation.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
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

function QuotationListSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quotation #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded w-32"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                <TableCell className="text-right"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></TableCell>
                <TableCell><div className="h-6 bg-gray-200 rounded w-16"></div></TableCell>
                <TableCell className="text-right"><div className="h-8 bg-gray-200 rounded w-16 ml-auto"></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;

  return (
    <FeaturePageGate feature="quotations" title="Quotations">
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-500">Create and manage quotations for your customers</p>
        </div>
        <Link href="/quotations/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Quotation
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form action="/quotations" method="get" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search by quotation number or customer..."
                  defaultValue={params.search}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <select
                name="status"
                defaultValue={params.status || ''}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
                <option value="converted">Converted</option>
              </select>
              <Button type="submit" variant="outline">Apply Filters</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Suspense fallback={<QuotationListSkeleton />}>
        <QuotationList searchTerm={params.search} status={params.status} />
      </Suspense>
    </section>
    </FeaturePageGate>
  );
}
