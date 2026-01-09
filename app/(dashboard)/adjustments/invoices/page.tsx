import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdjustments } from '@/lib/adjustments/queries';
import { FileText, PlusCircle } from 'lucide-react';
import { DeleteAdjustmentDialog } from '@/components/adjustments/delete-adjustment-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

async function InvoiceAdjustmentsList() {
  const adjustments = await getAdjustments();

  if (adjustments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 mb-4">No invoice adjustments recorded yet.</p>
          <p className="text-sm text-gray-400 mb-6">
            Create credit notes, debit notes, or add discounts and late fees to invoices.
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

  const getAdjustmentBadge = (type: string) => {
    switch (type) {
      case 'credit_note':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Credit Note</Badge>;
      case 'debit_note':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Debit Note</Badge>;
      case 'discount':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Discount</Badge>;
      case 'late_fee':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Late Fee</Badge>;
      case 'bank_charges':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Bank Charges</Badge>;
      default:
        return <Badge variant="secondary">{type.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Adjustments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.map(({ adjustment, invoice, customer }) => {
              const amount = parseFloat(adjustment.amount);
              const isNegative = amount < 0;

              return (
                <TableRow key={adjustment.id}>
                  <TableCell className="text-sm">
                    {new Date(adjustment.adjustmentDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-sm">
                    <Link
                      href={`/invoices/${invoice?.id}`}
                      className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      {invoice?.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {customer?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {getAdjustmentBadge(adjustment.adjustmentType)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                    {adjustment.description}
                  </TableCell>
                  <TableCell className="text-sm text-right">
                    <span className={`font-semibold ${
                      isNegative ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isNegative ? '' : '+'}{invoice?.currency} {Math.abs(amount).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

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
                <span className={`font-semibold ${
                  adjustments.reduce((sum, { adjustment }) => sum + parseFloat(adjustment.amount), 0) < 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
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

export default function InvoiceAdjustmentsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Invoice Adjustments
          </h1>
          <p className="text-sm text-gray-500">
            Create and manage credit notes, debit notes, discounts and fees for invoices
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
        <InvoiceAdjustmentsList />
      </Suspense>
    </section>
  );
}
