import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBillAdjustments } from '@/lib/bill-adjustments/queries';
import { FileText, PlusCircle } from 'lucide-react';
import { DeleteBillAdjustmentDialog } from '@/components/bill-adjustments/delete-bill-adjustment-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

async function BillAdjustmentsList() {
  const adjustments = await getBillAdjustments();

  if (adjustments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 mb-4">No bill adjustments recorded yet.</p>
          <p className="text-sm text-gray-400 mb-6">
            Create credit notes, debit notes, or add discounts and late fees to supplier bills.
          </p>
          <Link href="/adjustments/bills/new">
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
        <CardTitle>Bill Adjustments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Bill</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.map(({ adjustment, bill, supplier }) => {
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
                      href={`/purchases/bills/${bill?.id}`}
                      className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      {bill?.billNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {supplier?.name || 'N/A'}
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
                      {isNegative ? '' : '+'}{bill?.currency} {Math.abs(amount).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/purchases/bills/${bill?.id}`}>
                        <Button variant="ghost" size="sm">
                          View Bill
                        </Button>
                      </Link>
                      <DeleteBillAdjustmentDialog
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

export default function BillAdjustmentsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Bill Adjustments
          </h1>
          <p className="text-sm text-gray-500">
            Create and manage credit notes, debit notes, discounts and fees for supplier bills
          </p>
        </div>
        <Link href="/adjustments/bills/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Adjustment
          </Button>
        </Link>
      </div>

      <Suspense fallback={<AdjustmentsListSkeleton />}>
        <BillAdjustmentsList />
      </Suspense>
    </section>
  );
}
