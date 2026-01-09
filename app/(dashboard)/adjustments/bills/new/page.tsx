'use client';

import { useState, useActionState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createBillAdjustment } from '@/lib/bill-adjustments/actions';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NewBillAdjustmentPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(createBillAdjustment, { error: '' });
  const [adjustmentType, setAdjustmentType] = useState<string>('discount');
  const [adjustmentDate, setAdjustmentDate] = useState<Date>(new Date());

  const { data: bills } = useSWR('/api/purchases/bills', fetcher);

  // Handle navigation after successful submission
  useEffect(() => {
    if ('success' in state && state.success) {
      router.push('/adjustments/bills');
    }
  }, [state, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(() => {
      formAction(formData);
    });
  };

  const getAdjustmentHelp = () => {
    switch (adjustmentType) {
      case 'discount':
        return 'Enter a negative amount (e.g., -50.00) to reduce the bill total';
      case 'late_fee':
        return 'Enter a positive amount (e.g., 25.00) to add a late payment fee';
      case 'credit_note':
        return 'Enter a negative amount to credit from the supplier';
      case 'debit_note':
        return 'Enter a positive amount to charge additional fees';
      case 'bank_charges':
        return 'Enter a positive amount for bank transaction fees';
      default:
        return 'Enter positive for charges/fees, negative for discounts/credits';
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/adjustments/bills"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Bill Adjustments
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Create Bill Adjustment
        </h1>
        <p className="text-sm text-gray-500">
          Add credit notes, debit notes, discounts or fees to a supplier bill
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Adjustment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="billId" className="mb-2">
                Supplier Bill <span className="text-red-500">*</span>
              </Label>
              <select
                id="billId"
                name="billId"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select a bill</option>
                {bills?.map((item: any) => (
                  <option key={item.bill.id} value={item.bill.id}>
                    {item.bill.billNumber} - {item.supplier?.name} ({item.bill.currency}{' '}
                    {parseFloat(item.bill.amountDue).toFixed(2)} due)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the supplier bill to apply this adjustment to
              </p>
            </div>

            <div>
              <Label htmlFor="adjustmentType" className="mb-2">
                Adjustment Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="adjustmentType"
                name="adjustmentType"
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="discount">Discount</option>
                <option value="late_fee">Late Fee</option>
                <option value="credit_note">Credit Note</option>
                <option value="debit_note">Debit Note</option>
                <option value="bank_charges">Bank Charges</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="amount" className="mb-2">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {getAdjustmentHelp()}
              </p>
            </div>

            <div>
              <Label htmlFor="description" className="mb-2">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the reason for this adjustment..."
                required
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="adjustmentDate" className="mb-2">
                Adjustment Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                id="adjustmentDate"
                name="adjustmentDate"
                date={adjustmentDate}
                onDateChange={(date) => setAdjustmentDate(date || new Date())}
                placeholder="Select adjustment date"
                required
              />
            </div>

            <div>
              <Label htmlFor="referenceNumber" className="mb-2">
                Reference Number
              </Label>
              <Input
                id="referenceNumber"
                name="referenceNumber"
                type="text"
                placeholder="Optional reference number"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="mb-2">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Optional additional notes..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {state.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isPending ? 'Creating...' : 'Create Adjustment'}
          </Button>
          <Link href="/adjustments/bills">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </section>
  );
}
