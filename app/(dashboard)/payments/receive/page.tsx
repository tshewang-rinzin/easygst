'use client';

import { useState, useActionState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Wallet, Check, Plus, Trash2 } from 'lucide-react';
import useSWR from 'swr';
import { recordCustomerPayment } from '@/lib/customer-payments/actions';
import { useRouter } from 'next/navigation';
import { SearchableCustomerSelect } from '@/components/customers/searchable-customer-select';
import { SearchableInvoiceSelect } from '@/components/invoices/searchable-invoice-select';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface OutstandingInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;
  currency: string;
}

export default function ReceivePaymentPage() {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [allocations, setAllocations] = useState<{ invoiceId: number; allocatedAmount: string }[]>([]);

  const { data: customers } = useSWR('/api/customers', fetcher);
  const { data: paymentMethods, isLoading: loadingMethods } = useSWR('/api/payment-methods/enabled', fetcher);
  const { data: outstandingInvoices } = useSWR(
    selectedCustomer ? `/api/customers/${selectedCustomer.id}/outstanding-invoices` : null,
    fetcher
  );

  const [state, formAction] = useActionState(recordCustomerPayment, { error: '' });

  // Set default payment method
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentMethods[0].code);
    }
  }, [paymentMethods, paymentMethod]);

  // Auto-navigate on success
  useEffect(() => {
    if (state.success) {
      router.push('/payments/receipts');
    }
  }, [state.success, router]);

  const handleAddAllocation = () => {
    if (!outstandingInvoices || outstandingInvoices.length === 0) return;

    const firstUnallocated = outstandingInvoices.find(
      (inv: OutstandingInvoice) => !allocations.some(a => a.invoiceId === inv.id)
    );

    if (firstUnallocated) {
      setAllocations([...allocations, { invoiceId: firstUnallocated.id, allocatedAmount: firstUnallocated.amountDue }]);
    }
  };

  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleAllocationChange = (index: number, field: 'invoiceId' | 'allocatedAmount', value: string | number) => {
    const updated = [...allocations];
    if (field === 'invoiceId') {
      updated[index].invoiceId = Number(value);
      // Auto-fill amount with invoice amount due
      const invoice = outstandingInvoices?.find((inv: OutstandingInvoice) => inv.id === Number(value));
      if (invoice) {
        updated[index].allocatedAmount = invoice.amountDue;
      }
    } else {
      updated[index].allocatedAmount = String(value);
    }
    setAllocations(updated);
  };

  const getTotalAllocation = () => {
    return allocations.reduce((sum, alloc) => sum + (parseFloat(alloc.allocatedAmount) || 0), 0);
  };

  const getInvoiceDetails = (invoiceId: number) => {
    return outstandingInvoices?.find((inv: OutstandingInvoice) => inv.id === invoiceId);
  };

  const getMethodType = (code: string): 'cash' | 'bank_transfer' | 'online' | 'cheque' | 'other' => {
    const lowerCode = code.toLowerCase();
    if (lowerCode === 'cash' || lowerCode.includes('cash')) return 'cash';
    if (lowerCode === 'cheque' || lowerCode.includes('cheque')) return 'cheque';
    if (lowerCode.includes('bank') || lowerCode.includes('transfer')) return 'bank_transfer';
    if (
      lowerCode.includes('online') ||
      lowerCode.includes('epay') ||
      lowerCode.includes('mpay') ||
      lowerCode.includes('mbob') ||
      lowerCode.includes('digital')
    )
      return 'online';
    return 'other';
  };

  const methodType = paymentMethod ? getMethodType(paymentMethod) : 'other';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    if (allocations.length === 0) {
      alert('Please add at least one invoice allocation');
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append('customerId', selectedCustomer.id.toString());
    formData.append('paymentDate', paymentDate.toISOString());
    formData.append('allocations', JSON.stringify(allocations));

    formAction(formData);
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-6 w-6 text-orange-500" />
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">Receive Payment</h1>
        </div>
        <p className="text-sm text-gray-500">Record customer payments and allocate to invoices</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <SearchableCustomerSelect
                customers={customers || []}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={(customer) => {
                  setSelectedCustomer(customer);
                  setAllocations([]); // Reset allocations when customer changes
                }}
                label="Select Customer"
                placeholder="Search by name, email, mobile, or TPN..."
                required
              />
            </div>

            {selectedCustomer && outstandingInvoices && outstandingInvoices.length === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <Check className="inline h-4 w-4 mr-1" />
                  This customer has no outstanding invoices.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCustomer && outstandingInvoices && outstandingInvoices.length > 0 && (
          <>
            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount" className="mb-2">
                      Payment Amount <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency" className="mb-2">
                      Currency <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="currency"
                      name="currency"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="BTN">BTN - Bhutanese Ngultrum</option>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentDate" className="mb-2">
                      Payment Date <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      id="paymentDate"
                      date={paymentDate}
                      onDateChange={(date) => setPaymentDate(date || new Date())}
                      placeholder="Select payment date"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod" className="mb-2">
                      Payment Method <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                      disabled={loadingMethods}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {loadingMethods ? (
                        <option>Loading...</option>
                      ) : (
                        paymentMethods?.map((method: any) => (
                          <option key={method.id} value={method.code}>
                            {method.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Dynamic fields based on payment method */}
                {methodType === 'bank_transfer' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-sm text-gray-700">Bank Transfer Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input name="bankName" placeholder="Bank name" />
                      <Input name="transactionId" placeholder="Transaction ID / Reference" />
                    </div>
                  </div>
                )}

                {methodType === 'cheque' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-sm text-gray-700">Cheque Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input name="chequeNumber" placeholder="Cheque number" />
                      <Input name="bankName" placeholder="Bank name" />
                    </div>
                  </div>
                )}

                {methodType === 'online' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-sm text-gray-700">Online Payment Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input name="paymentGateway" placeholder="Gateway (e.g., M-BoB, PayPal)" />
                      <Input name="transactionId" placeholder="Transaction ID" />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes" className="mb-2">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Optional payment notes..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Allocations */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Allocate to Invoices</CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddAllocation}
                    disabled={allocations.length >= outstandingInvoices.length}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Invoice
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {allocations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">No allocations added yet</p>
                    <p className="text-sm">Click "Add Invoice" to allocate payment to invoices</p>
                  </div>
                ) : (
                  allocations.map((allocation, index) => {
                    const invoice = getInvoiceDetails(allocation.invoiceId);
                    // Get list of invoice IDs already allocated (excluding current row)
                    const excludedInvoiceIds = allocations
                      .filter((_, i) => i !== index)
                      .map((a) => a.invoiceId);

                    return (
                      <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <SearchableInvoiceSelect
                              invoices={outstandingInvoices || []}
                              selectedInvoiceId={allocation.invoiceId}
                              onSelectInvoice={(invoiceId) => {
                                if (invoiceId) {
                                  handleAllocationChange(index, 'invoiceId', invoiceId);
                                }
                              }}
                              excludedInvoiceIds={excludedInvoiceIds}
                              label="Invoice"
                              placeholder="Search invoice by number, date, or amount..."
                            />
                          </div>
                          <div>
                            <Label htmlFor={`amount-${index}`} className="mb-1 text-xs">
                              Allocated Amount
                            </Label>
                            <Input
                              id={`amount-${index}`}
                              type="number"
                              step="0.01"
                              value={allocation.allocatedAmount}
                              onChange={(e) => handleAllocationChange(index, 'allocatedAmount', e.target.value)}
                              className="text-sm"
                            />
                            {invoice && (
                              <p className="text-xs text-gray-500 mt-1">
                                Max: {invoice.currency} {parseFloat(invoice.amountDue).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAllocation(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}

                {allocations.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Allocation:</span>
                      <span className="text-orange-600">
                        {selectedCustomer?.currency || 'BTN'} {getTotalAllocation().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
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
                className="bg-orange-500 hover:bg-orange-600"
                disabled={allocations.length === 0}
              >
                <Check className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/sales/invoices')}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
