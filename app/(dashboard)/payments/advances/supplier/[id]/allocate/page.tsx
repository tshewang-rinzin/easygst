'use client';

import { use, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AllocateSupplierAdvancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [allocations, setAllocations] = useState<{ billId: number; allocatedAmount: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: advance, isLoading } = useSWR(`/api/supplier-advances/${id}`, fetcher);

  // Get outstanding bills - we'll need to infer supplier ID from allocations if any
  // For now, we'll fetch all outstanding bills when advance is loaded
  const { data: outstandingBills } = useSWR(
    advance ? `/api/suppliers/outstanding-bills` : null,
    fetcher
  );

  const handleAddAllocation = () => {
    if (!outstandingBills || outstandingBills.length === 0) return;

    const firstUnallocated = outstandingBills.find(
      (bill: any) => !allocations.some(a => a.billId === bill.id)
    );

    if (firstUnallocated) {
      setAllocations([...allocations, { billId: firstUnallocated.id, allocatedAmount: firstUnallocated.amountDue }]);
    }
  };

  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleAllocationChange = (index: number, field: 'billId' | 'allocatedAmount', value: string | number) => {
    const updated = [...allocations];
    if (field === 'billId') {
      updated[index].billId = Number(value);
      // Auto-fill amount with bill amount due
      const bill = outstandingBills?.find((b: any) => b.id === Number(value));
      if (bill) {
        updated[index].allocatedAmount = bill.amountDue;
      }
    } else {
      updated[index].allocatedAmount = value as string;
    }
    setAllocations(updated);
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || '0'), 0);
  const unallocatedAmount = parseFloat(advance?.unallocatedAmount || '0');
  const remainingBalance = unallocatedAmount - totalAllocated;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (allocations.length === 0) {
      setError('Please add at least one allocation');
      return;
    }

    if (totalAllocated > unallocatedAmount) {
      setError('Total allocation exceeds available advance balance');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/supplier-advances/${id}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations }),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
      } else {
        router.push(`/payments/advances/supplier/${id}`);
      }
    } catch (err) {
      setError('Failed to allocate advance');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12 text-muted-foreground">
          Loading...
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/payments/advances/supplier/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Allocate Advance</h1>
          <p className="text-muted-foreground">
            Allocate advance {advance.advanceNumber} to supplier bills
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Available Balance</div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(unallocatedAmount, advance.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Allocating</div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAllocated, advance.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Remaining</div>
            <div className={`text-2xl font-bold ${remainingBalance < 0 ? 'text-destructive' : ''}`}>
              {formatCurrency(remainingBalance, advance.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Bill Allocations</CardTitle>
              <Button
                type="button"
                onClick={handleAddAllocation}
                variant="outline"
                size="sm"
                disabled={!outstandingBills || outstandingBills.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Bill
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {allocations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No allocations added. Click &quot;Add Bill&quot; to start.
              </div>
            ) : (
              <div className="space-y-4">
                {allocations.map((allocation, index) => {
                  const bill = outstandingBills?.find((b: any) => b.id === allocation.billId);
                  return (
                    <div key={index} className="flex gap-4 items-end border p-4 rounded-md">
                      <div className="flex-1 space-y-2">
                        <Label>Bill</Label>
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          value={allocation.billId}
                          onChange={(e) => handleAllocationChange(index, 'billId', e.target.value)}
                          required
                        >
                          <option value="">Select a bill</option>
                          {outstandingBills?.map((bill: any) => (
                            <option
                              key={bill.id}
                              value={bill.id}
                              disabled={allocations.some((a, i) => i !== index && a.billId === bill.id)}
                            >
                              {bill.billNumber} - Due: {formatCurrency(bill.amountDue, bill.currency)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-48 space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={allocation.allocatedAmount}
                          onChange={(e) => handleAllocationChange(index, 'allocatedAmount', e.target.value)}
                          required
                        />
                      </div>
                      {bill && (
                        <div className="text-sm text-muted-foreground">
                          Due: {formatCurrency(bill.amountDue, bill.currency)}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAllocation(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Link href={`/payments/advances/supplier/${id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || allocations.length === 0 || remainingBalance < 0}>
                <Check className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Allocating...' : 'Allocate Advance'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
