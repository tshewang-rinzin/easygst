'use client';

import { useState, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign } from 'lucide-react';
import { recordPayment } from '@/lib/payments/actions';
import useSWR from 'swr';
import type { PaymentMethod } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RecordPaymentDialogProps {
  invoiceId: number;
  invoiceNumber: string;
  currency: string;
  amountDue: string;
}

export function RecordPaymentDialog({
  invoiceId,
  invoiceNumber,
  currency,
  amountDue,
}: RecordPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(recordPayment, { error: '' });
  const { data: paymentMethods } = useSWR<PaymentMethod[]>(
    '/api/payment-methods/enabled',
    fetcher
  );

  if (state.success) {
    setOpen(false);
    router.refresh();
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('invoiceId', invoiceId.toString());

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-green-600 hover:bg-green-700">
          <DollarSign className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice {invoiceNumber}. Amount due:{' '}
              {currency} {parseFloat(amountDue).toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={amountDue}
                placeholder="0.00"
                required
                defaultValue={amountDue}
              />
            </div>

            <div>
              <Label htmlFor="paymentDate" className="text-sm font-medium mb-2 block">
                Payment Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paymentDate"
                name="paymentDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod" className="text-sm font-medium mb-2 block">
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                defaultValue={paymentMethods && paymentMethods.length > 0 ? paymentMethods[0].code : 'cash'}
              >
                {paymentMethods && paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <option key={method.id} value={method.code}>
                      {method.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online_payment">Online Payment</option>
                    <option value="cheque">Cheque</option>
                  </>
                )}
              </select>
              {(!paymentMethods || paymentMethods.length === 0) && (
                <p className="text-xs text-gray-500 mt-1">
                  Using default payment methods. Configure payment methods in settings.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="transactionId" className="text-sm font-medium mb-2 block">
                Transaction ID / Reference
              </Label>
              <Input
                id="transactionId"
                name="transactionId"
                type="text"
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="receiptNumber" className="text-sm font-medium mb-2 block">
                Receipt Number
              </Label>
              <Input
                id="receiptNumber"
                name="receiptNumber"
                type="text"
                placeholder="Optional"
              />
            </div>

            {/* Payment Adjustments Section */}
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Payment Adjustments (Optional)
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Add discounts (negative) or fees (positive) to this payment
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="adjustmentAmount" className="text-sm font-medium mb-2 block">
                    Adjustment Amount
                  </Label>
                  <Input
                    id="adjustmentAmount"
                    name="adjustmentAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Negative for discount, positive for fee
                  </p>
                </div>

                <div>
                  <Label htmlFor="adjustmentReason" className="text-sm font-medium mb-2 block">
                    Adjustment Reason
                  </Label>
                  <select
                    id="adjustmentReason"
                    name="adjustmentReason"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  >
                    <option value="">None</option>
                    <option value="discount">Discount</option>
                    <option value="late_fee">Late Fee</option>
                    <option value="bank_charges">Bank Charges</option>
                    <option value="currency_conversion">Currency Conversion</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Optional payment notes or adjustment details"
                rows={2}
              />
            </div>
          </div>

          {state.error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
