'use client';

import { useState, useActionState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Wallet, ArrowLeft } from 'lucide-react';
import useSWR from 'swr';
import { recordSupplierAdvance } from '@/lib/supplier-payments/actions';
import { useRouter } from 'next/navigation';
import { SearchableSupplierSelect } from '@/components/suppliers/searchable-supplier-select';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NewSupplierAdvancePage() {
  const router = useRouter();
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('');

  const { data: paymentMethods, isLoading: loadingMethods } = useSWR('/api/payment-methods/enabled', fetcher);
  const { data: suppliers } = useSWR('/api/suppliers', fetcher);

  const [state, formAction, isPending] = useActionState(recordSupplierAdvance, { error: '' });

  // Set default payment method
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentMethods[0].code);
    }
  }, [paymentMethods, paymentMethod]);

  // Auto-navigate on success
  useEffect(() => {
    if ('success' in state && state.success) {
      router.push('/payments/advances/supplier');
    }
  }, [state, router]);

  const selectedMethod = paymentMethods?.find((m: any) => m.code === paymentMethod);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payments/advances/supplier">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Record Supplier Advance</h1>
          <p className="text-muted-foreground">
            Record a prepayment made to a supplier
          </p>
        </div>
      </div>

      <form action={formAction}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Advance Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {state.error && (
              <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <SearchableSupplierSelect
                suppliers={suppliers || []}
                selectedSupplier={selectedSupplier}
                onSelectSupplier={setSelectedSupplier}
              />
              <input
                type="hidden"
                name="supplierId"
                value={selectedSupplier?.id || ''}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <select
                  id="currency"
                  name="currency"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue="BTN"
                  required
                >
                  <option value="BTN">BTN (Ngultrum)</option>
                  <option value="INR">INR (Indian Rupee)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Payment Date *</Label>
                <DatePicker date={paymentDate} onDateChange={(date) => setPaymentDate(date || new Date())} />
                <input
                  type="hidden"
                  name="paymentDate"
                  value={paymentDate?.toISOString()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                {loadingMethods ? (
                  <div className="text-sm text-muted-foreground">Loading methods...</div>
                ) : (
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    {paymentMethods?.map((method: any) => (
                      <option key={method.code} value={method.code}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {selectedMethod && selectedMethod.code === 'bank_transfer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input id="bankName" name="bankName" placeholder="Bank name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input id="transactionId" name="transactionId" placeholder="Transaction ID" />
                </div>
              </div>
            )}

            {selectedMethod && selectedMethod.code === 'cheque' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="chequeNumber">Cheque Number</Label>
                  <Input id="chequeNumber" name="chequeNumber" placeholder="Cheque number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input id="bankName" name="bankName" placeholder="Bank name" />
                </div>
              </div>
            )}

            {selectedMethod && selectedMethod.code === 'online' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="paymentGateway">Payment Gateway</Label>
                  <Input id="paymentGateway" name="paymentGateway" placeholder="e.g., mBoB, mPay" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input id="transactionId" name="transactionId" placeholder="Transaction ID" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes (optional)"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/payments/advances/supplier">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isPending || !selectedSupplier}>
                {isPending ? 'Recording...' : 'Record Advance'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
