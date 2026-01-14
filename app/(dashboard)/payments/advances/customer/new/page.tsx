'use client';

import { useState, useActionState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wallet, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { recordCustomerAdvance } from '@/lib/customer-payments/actions';
import { useRouter } from 'next/navigation';
import { SearchableCustomerSelect } from '@/components/customers/searchable-customer-select';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NewCustomerAdvancePage() {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currency, setCurrency] = useState('BTN');

  const { data: paymentMethods, isLoading: loadingMethods } = useSWR('/api/payment-methods/enabled', fetcher);
  const { data: customers } = useSWR('/api/customers', fetcher);

  const [state, formAction, isPending] = useActionState(recordCustomerAdvance, { error: '' });

  // Set default payment method
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentMethods[0].code);
    }
  }, [paymentMethods, paymentMethod]);

  // Auto-navigate on success
  useEffect(() => {
    if ('success' in state && state.success) {
      router.push('/payments/advances/customer');
    }
  }, [state, router]);

  const selectedMethod = paymentMethods?.find((m: any) => m.code === paymentMethod);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/payments/advances/customer">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">
            Record Customer Advance
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Record a prepayment received from a customer
          </p>
        </div>
      </div>

      <form action={formAction}>
        <Card className="max-w-3xl">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-orange-500" />
              Advance Details
            </CardTitle>
            <CardDescription>
              Enter the advance payment information below
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {state.error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customer" className="text-sm font-medium text-gray-700">
                Customer <span className="text-red-500">*</span>
              </Label>
              <SearchableCustomerSelect
                customers={customers || []}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer}
              />
              <input
                type="hidden"
                name="customerId"
                value={selectedCustomer?.id || ''}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                  Currency <span className="text-red-500">*</span>
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTN">BTN (Ngultrum)</SelectItem>
                    <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="currency" value={currency} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Payment Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker date={paymentDate} onDateChange={(date) => setPaymentDate(date || new Date())} />
                <input
                  type="hidden"
                  name="paymentDate"
                  value={paymentDate?.toISOString()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700">
                  Payment Method <span className="text-red-500">*</span>
                </Label>
                {loadingMethods ? (
                  <div className="flex items-center gap-2 h-10 px-3 text-sm text-gray-500 border rounded-md bg-gray-50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading methods...
                  </div>
                ) : (
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods?.map((method: any) => (
                        <SelectItem key={method.code} value={method.code}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <input type="hidden" name="paymentMethod" value={paymentMethod} />
              </div>
            </div>

            {selectedMethod && selectedMethod.code === 'bank_transfer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <Label htmlFor="bankName" className="text-sm font-medium text-gray-700">
                    Bank Name
                  </Label>
                  <Input id="bankName" name="bankName" placeholder="Bank name" className="h-10 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">
                    Transaction ID
                  </Label>
                  <Input id="transactionId" name="transactionId" placeholder="Transaction ID" className="h-10 bg-white" />
                </div>
              </div>
            )}

            {selectedMethod && selectedMethod.code === 'cheque' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <Label htmlFor="chequeNumber" className="text-sm font-medium text-gray-700">
                    Cheque Number
                  </Label>
                  <Input id="chequeNumber" name="chequeNumber" placeholder="Cheque number" className="h-10 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName" className="text-sm font-medium text-gray-700">
                    Bank Name
                  </Label>
                  <Input id="bankName" name="bankName" placeholder="Bank name" className="h-10 bg-white" />
                </div>
              </div>
            )}

            {selectedMethod && selectedMethod.code === 'online' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <Label htmlFor="paymentGateway" className="text-sm font-medium text-gray-700">
                    Payment Gateway
                  </Label>
                  <Input id="paymentGateway" name="paymentGateway" placeholder="e.g., mBoB, mPay" className="h-10 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">
                    Transaction ID
                  </Label>
                  <Input id="transactionId" name="transactionId" placeholder="Transaction ID" className="h-10 bg-white" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes (optional)"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/payments/advances/customer">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isPending || !selectedCustomer}
                className="bg-orange-500 hover:bg-orange-600 min-w-[140px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Advance'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </section>
  );
}
