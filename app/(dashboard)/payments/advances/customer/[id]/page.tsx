'use client';

import { use, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, FileText } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { deleteCustomerAdvance } from '@/lib/customer-payments/actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CustomerAdvanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: advance, isLoading } = useSWR(`/api/customer-advances/${id}`, fetcher);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this advance? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteCustomerAdvance({ id: parseInt(id) });

    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
    } else {
      mutate('/api/customer-advances');
      router.push('/payments/advances/customer');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12 text-muted-foreground">
          Loading advance details...
        </div>
      </div>
    );
  }

  if (!advance) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12 text-muted-foreground">
          Advance not found
        </div>
      </div>
    );
  }

  const hasAllocations = parseFloat(advance.allocatedAmount) > 0;
  const hasUnallocated = parseFloat(advance.unallocatedAmount) > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payments/advances/customer">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{advance.advanceNumber}</h1>
            <p className="text-muted-foreground">Customer Advance Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasUnallocated && (
            <Link href={`/payments/advances/customer/${id}/allocate`}>
              <Button>
                Allocate to Invoices
              </Button>
            </Link>
          )}
          {!hasAllocations && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Advance Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Customer</div>
              <div className="font-medium">{advance.customer?.name || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Advance Number</div>
              <div className="font-medium">{advance.advanceNumber}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Payment Date</div>
              <div className="font-medium">
                {new Date(advance.paymentDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Payment Method</div>
              <div className="font-medium">
                {advance.paymentMethodName || advance.paymentMethod}
              </div>
            </div>
            {advance.transactionId && (
              <div>
                <div className="text-sm text-muted-foreground">Transaction ID</div>
                <div className="font-medium">{advance.transactionId}</div>
              </div>
            )}
            {advance.notes && (
              <div>
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="text-sm">{advance.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amount Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-bold">
                {formatCurrency(advance.amount, advance.currency)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Allocated Amount</div>
              <div className="text-xl font-medium">
                {formatCurrency(advance.allocatedAmount, advance.currency)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Unallocated Amount</div>
              <div className="text-xl font-medium text-primary">
                {formatCurrency(advance.unallocatedAmount, advance.currency)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {advance.allocations && advance.allocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Allocations to Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Invoice Number</th>
                    <th className="text-left p-2">Invoice Date</th>
                    <th className="text-right p-2">Invoice Total</th>
                    <th className="text-right p-2">Allocated Amount</th>
                    <th className="text-left p-2">Allocation Date</th>
                  </tr>
                </thead>
                <tbody>
                  {advance.allocations.map((allocation: any) => (
                    <tr key={allocation.id} className="border-b">
                      <td className="p-2 font-medium">
                        {allocation.invoice?.invoiceNumber || 'N/A'}
                      </td>
                      <td className="p-2">
                        {allocation.invoice?.invoiceDate
                          ? new Date(allocation.invoice.invoiceDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="p-2 text-right">
                        {allocation.invoice
                          ? formatCurrency(allocation.invoice.totalAmount, allocation.invoice.currency)
                          : 'N/A'}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(allocation.allocatedAmount, advance.currency)}
                      </td>
                      <td className="p-2">
                        {new Date(allocation.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
