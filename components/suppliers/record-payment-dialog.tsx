'use client';

import { useState, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { X, DollarSign } from 'lucide-react';
import { recordSupplierPayment } from '@/lib/supplier-payments/actions';
import { mutate } from 'swr';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RecordPaymentDialogProps {
  billId: string;
  amountDue: string;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordPaymentDialog({
  billId,
  amountDue,
  currency,
  onClose,
  onSuccess,
}: RecordPaymentDialogProps) {
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('');

  // Fetch enabled payment methods
  const { data: paymentMethods, isLoading: loadingMethods } = useSWR(
    '/api/payment-methods/enabled',
    fetcher
  );

  // Set default payment method when data loads
  if (paymentMethods && paymentMethods.length > 0 && !paymentMethod) {
    setPaymentMethod(paymentMethods[0].code);
  }

  const [state, formAction, isPending] = useActionState(recordSupplierPayment, {
    error: '',
  } as any);

  useEffect(() => {
    if ('success' in state && state.success) {
      mutate(`/api/purchases/bills/${billId}`);
      onSuccess();
    }
  }, [state, billId, onSuccess]);

  // Helper function to determine field requirements based on payment method code
  const getMethodType = (code: string): 'cash' | 'bank_transfer' | 'online' | 'cheque' | 'other' => {
    const lowerCode = code.toLowerCase();
    if (lowerCode === 'cash' || lowerCode.includes('cash')) return 'cash';
    if (lowerCode === 'cheque' || lowerCode.includes('cheque') || lowerCode.includes('check')) return 'cheque';
    if (lowerCode.includes('bank') || lowerCode.includes('transfer') || lowerCode.includes('wire')) return 'bank_transfer';
    if (lowerCode.includes('online') || lowerCode.includes('epay') || lowerCode.includes('mpay') ||
        lowerCode.includes('mbob') || lowerCode.includes('digital') || lowerCode.includes('wallet')) return 'online';
    return 'other';
  };

  const methodType = paymentMethod ? getMethodType(paymentMethod) : 'other';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Record Payment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form action={formAction} className="flex flex-col flex-1 overflow-hidden">
          <input type="hidden" name="billId" value={billId} />
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Amount Due:
              </span>
              <span className="text-lg font-bold text-gray-900">
                {currency} {parseFloat(amountDue).toFixed(2)}
              </span>
            </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">
                  Payment Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={parseFloat(amountDue)}
                  placeholder="Enter payment amount"
                  required
                />
              </div>

              <div>
                <Label htmlFor="paymentDate">
                  Payment Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  id="paymentDate"
                  name="paymentDate"
                  date={paymentDate}
                  onDateChange={(date) => setPaymentDate(date || new Date())}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod">
                Payment Method <span className="text-red-500">*</span>
              </Label>
              {loadingMethods ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500">
                  Loading payment methods...
                </div>
              ) : paymentMethods && paymentMethods.length > 0 ? (
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  {paymentMethods.map((method: any) => (
                    <option key={method.id} value={method.code}>
                      {method.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 border border-red-300 bg-red-50 rounded-md text-red-700 text-sm">
                  No payment methods configured. Please add payment methods in Settings.
                </div>
              )}
            </div>

            <input type="hidden" name="currency" value={currency} />

            {/* Dynamic fields based on payment method type */}
            {methodType === 'bank_transfer' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Bank Transfer Details</h3>
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    type="text"
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input
                    id="transactionId"
                    name="transactionId"
                    type="text"
                    placeholder="Enter transaction ID"
                  />
                </div>
              </div>
            )}

            {methodType === 'cheque' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Cheque Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="chequeNumber">Cheque Number</Label>
                    <Input
                      id="chequeNumber"
                      name="chequeNumber"
                      type="text"
                      placeholder="Enter cheque number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      type="text"
                      placeholder="Enter bank name"
                    />
                  </div>
                </div>
              </div>
            )}

            {methodType === 'online' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Online Payment Details</h3>
                <div>
                  <Label htmlFor="paymentGateway">Payment Gateway</Label>
                  <Input
                    id="paymentGateway"
                    name="paymentGateway"
                    type="text"
                    placeholder="e.g., M-BoB, PayPal, Stripe, Razorpay"
                  />
                </div>
                <div>
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input
                    id="transactionId"
                    name="transactionId"
                    type="text"
                    placeholder="Enter transaction ID"
                  />
                </div>
              </div>
            )}

            {methodType === 'cash' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div>
                  <Label htmlFor="receiptNumber">Receipt Number</Label>
                  <Input
                    id="receiptNumber"
                    name="receiptNumber"
                    type="text"
                    placeholder="Enter receipt number (optional)"
                  />
                </div>
              </div>
            )}

            {/* Common fields for non-cash payment methods */}
            {methodType !== 'cash' && (
              <div>
                <Label htmlFor="receiptNumber">Receipt Number</Label>
                <Input
                  id="receiptNumber"
                  name="receiptNumber"
                  type="text"
                  placeholder="Enter receipt number (optional)"
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Add any notes about this payment..."
                rows={3}
                className="resize-none"
              />
            </div>

            {'error' in state && state.error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-sm text-red-700">{state.error}</p>
              </div>
            )}
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !paymentMethods || paymentMethods.length === 0}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
