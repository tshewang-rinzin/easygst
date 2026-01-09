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
import { Badge } from '@/components/ui/badge';
import { getSupplierBills } from '@/lib/supplier-bills/queries';
import { PlusCircle, FileText } from 'lucide-react';

async function SupplierBillsList() {
  const bills = await getSupplierBills();

  if (bills.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No supplier bills found</p>
          <p className="text-sm text-gray-400 mb-6">
            Create your first supplier bill to track purchases
          </p>
          <Link href="/purchases/bills/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Bill
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
      received: { label: 'Received', className: 'bg-blue-100 text-blue-800' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
      partial: { label: 'Partial', className: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600' },
    };

    const variant = variants[status] || variants.draft;
    return (
      <Badge className={`${variant.className} hover:${variant.className}`}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Bills ({bills.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Amount Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map(({ bill, supplier }) => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/purchases/bills/${bill.id}`}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    {bill.billNumber}
                  </Link>
                </TableCell>
                <TableCell>{supplier?.name || 'N/A'}</TableCell>
                <TableCell className="text-sm">
                  {new Date(bill.billDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-sm">
                  {bill.dueDate
                    ? new Date(bill.dueDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {bill.currency} {parseFloat(bill.totalAmount).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`font-semibold ${
                      parseFloat(bill.amountDue) > 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {bill.currency} {parseFloat(bill.amountDue).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(bill.status)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/purchases/bills/${bill.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BillsListSkeleton() {
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

export default function SupplierBillsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Supplier Bills
          </h1>
          <p className="text-sm text-gray-500">
            Manage purchase invoices from suppliers
          </p>
        </div>
        <Link href="/purchases/bills/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Bill
          </Button>
        </Link>
      </div>

      <Suspense fallback={<BillsListSkeleton />}>
        <SupplierBillsList />
      </Suspense>
    </section>
  );
}
