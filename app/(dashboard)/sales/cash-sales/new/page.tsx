'use client';

import { useState, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, Plus, Trash2, Banknote } from 'lucide-react';
import Link from 'next/link';
import { createCashSale } from '@/lib/invoices/cash-sales-actions';
import { CustomerSearch } from '@/components/customers/customer-search';
import { ProductSearchInline } from '@/components/products/product-search-inline';
import { Customer, Product, TaxClassification, PaymentMethod } from '@/lib/db/schema';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountPercent: string;
  taxRate: string;
  isTaxExempt: boolean;
}

export default function NewCashSalePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(createCashSale, { error: '' });
  const { data: team } = useSWR('/api/team', fetcher);
  const { data: taxClassifications } = useSWR<TaxClassification[]>('/api/tax-classifications', fetcher);
  const { data: paymentMethods } = useSWR<PaymentMethod[]>('/api/payment-methods/enabled', fetcher);
  const defaultGstRate = team?.defaultGstRate || '0';

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: '1',
      unit: 'piece',
      unitPrice: '',
      discountPercent: '0',
      taxRate: defaultGstRate,
      isTaxExempt: false,
    },
  ]);

  if (state.success && state.invoiceId) {
    router.push(`/invoices/${state.invoiceId}`);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    const validItems = lineItems.filter((item) => item.description.trim() !== '');

    if (validItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    // Validate each item
    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      if (!item.description || item.description.trim() === '') {
        alert(`Item ${i + 1}: Description is required`);
        return;
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        alert(`Item ${i + 1}: Quantity must be greater than 0`);
        return;
      }
      if (!item.unitPrice || parseFloat(item.unitPrice) < 0) {
        alert(`Item ${i + 1}: Unit price is required`);
        return;
      }
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Convert items to proper format
    const itemsData = validItems.map((item) => ({
      description: item.description,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      unitPrice: parseFloat(item.unitPrice),
      discountPercent: parseFloat(item.discountPercent) || 0,
      taxRate: parseFloat(item.taxRate) || 0,
      isTaxExempt: item.isTaxExempt,
    }));

    // Create clean FormData
    const cleanFormData = new FormData();
    cleanFormData.append('customerId', selectedCustomer.id.toString());
    cleanFormData.append('invoiceDate', formData.get('invoiceDate') as string);
    cleanFormData.append('currency', formData.get('currency') as string);
    cleanFormData.append('items', JSON.stringify(itemsData));
    cleanFormData.append('paymentMethod', formData.get('paymentMethod') as string);

    const transactionId = formData.get('transactionId');
    if (transactionId) cleanFormData.append('transactionId', transactionId as string);

    const receiptNumber = formData.get('receiptNumber');
    if (receiptNumber) cleanFormData.append('receiptNumber', receiptNumber as string);

    const customerNotes = formData.get('customerNotes');
    if (customerNotes) cleanFormData.append('customerNotes', customerNotes as string);

    const notes = formData.get('notes');
    if (notes) cleanFormData.append('notes', notes as string);

    startTransition(() => {
      formAction(cleanFormData);
    });
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: '1',
        unit: 'piece',
        unitPrice: '',
        discountPercent: '0',
        taxRate: defaultGstRate,
        isTaxExempt: false,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | boolean) => {
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleProductSelect = (id: string, product: Product) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id
          ? {
              ...item,
              description: product.name,
              unitPrice: parseFloat(product.unitPrice).toFixed(2),
              unit: product.unit,
              taxRate: product.defaultTaxRate,
              isTaxExempt: product.isTaxExempt,
            }
          : item
      )
    );
  };

  const calculateItemTotal = (item: LineItem) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discountPercent) || 0;
    const taxRate = item.isTaxExempt ? 0 : parseFloat(item.taxRate) || 0;

    const subtotal = qty * price;
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxRate / 100);

    return afterDiscount + taxAmount;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    lineItems.forEach((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const discount = parseFloat(item.discountPercent) || 0;
      const taxRate = item.isTaxExempt ? 0 : parseFloat(item.taxRate) || 0;

      const itemSubtotal = qty * price;
      const discountAmount = itemSubtotal * (discount / 100);
      const afterDiscount = itemSubtotal - discountAmount;
      const taxAmount = afterDiscount * (taxRate / 100);

      subtotal += itemSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    const total = subtotal - totalDiscount + totalTax;

    return { subtotal, totalDiscount, totalTax, total };
  };

  const totals = calculateTotals();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-8">
        <Link
          href="/sales/cash-sales"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Cash Sales
        </Link>
        <div className="flex items-center gap-3">
          <Banknote className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              New Cash Sale
            </h1>
            <p className="text-sm text-gray-500">
              Record a sale with immediate payment (Invoice-cum-Receipt)
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-8">
        {/* Sale Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Sale Details</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                Customer Information
              </h3>
              <div>
                <CustomerSearch
                  onSelect={setSelectedCustomer}
                  selectedCustomer={selectedCustomer}
                />
                <input
                  type="hidden"
                  name="customerId"
                  value={selectedCustomer?.id || ''}
                />
              </div>

              {selectedCustomer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Selected Customer
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Change
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900 font-semibold">{selectedCustomer.name}</p>
                    {selectedCustomer.email && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {selectedCustomer.email}
                      </p>
                    )}
                    {selectedCustomer.phone && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {selectedCustomer.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sale Date & Currency */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                Sale Date & Currency
              </h3>

              <div>
                <Label htmlFor="invoiceDate" className="text-sm font-medium mb-2 block">
                  Sale Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  id="invoiceDate"
                  name="invoiceDate"
                  date={saleDate}
                  onDateChange={(date) => setSaleDate(date || new Date())}
                  placeholder="Select sale date"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency" className="text-sm font-medium mb-2 block">
                  Currency <span className="text-red-500">*</span>
                </Label>
                <select
                  id="currency"
                  name="currency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  defaultValue="BTN"
                  required
                >
                  <option value="BTN">BTN (Ngultrum)</option>
                  <option value="INR">INR (Indian Rupee)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Items</h2>
            <Button type="button" onClick={addLineItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider w-8">
                    #
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">
                    Description <span className="text-red-500">*</span>
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Qty <span className="text-red-500">*</span>
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Unit
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                    Price <span className="text-red-500">*</span>
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Disc %
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    GST Rate
                  </th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                    Exempt
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                    Total
                  </th>
                  <th className="py-3 px-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                    </td>
                    <td className="py-3 px-2">
                      <ProductSearchInline
                        value={item.description}
                        onChange={(value) => updateLineItem(item.id, 'description', value)}
                        onSelect={(product) => handleProductSelect(item.id, product)}
                        index={index}
                        required={false}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(item.id, 'quantity', e.target.value)
                        }
                        className="h-9 text-sm"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={item.unit}
                        onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                        className="w-full h-9 px-2 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="piece">Piece</option>
                        <option value="hour">Hour</option>
                        <option value="day">Day</option>
                        <option value="month">Month</option>
                        <option value="kg">Kg</option>
                        <option value="service">Service</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(item.id, 'unitPrice', e.target.value)
                        }
                        placeholder="0.00"
                        className="h-9 text-sm"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.discountPercent}
                        onChange={(e) =>
                          updateLineItem(item.id, 'discountPercent', e.target.value)
                        }
                        className="h-9 text-sm"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={item.taxRate}
                        onChange={(e) => updateLineItem(item.id, 'taxRate', e.target.value)}
                        disabled={item.isTaxExempt}
                        className="w-full h-9 px-2 py-1 border border-gray-300 rounded-md text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {taxClassifications && taxClassifications.length > 0 ? (
                          taxClassifications
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .filter((tc) => tc.isActive)
                            .map((classification) => (
                              <option
                                key={classification.id}
                                value={parseFloat(classification.taxRate).toString()}
                              >
                                {classification.name} ({parseFloat(classification.taxRate)}%)
                              </option>
                            ))
                        ) : (
                          <>
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="10">10%</option>
                            <option value="20">20%</option>
                            <option value="30">30%</option>
                            <option value="50">50%</option>
                          </>
                        )}
                      </select>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={item.isTaxExempt}
                        onChange={(e) =>
                          updateLineItem(item.id, 'isTaxExempt', e.target.checked)
                        }
                        className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {calculateItemTotal(item).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {lineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="mt-6 flex justify-end">
            <div className="w-full md:w-1/3 space-y-2 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-{totals.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total GST:</span>
                <span className="font-medium">{totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span className="text-green-600">{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            Payment Details (Immediate)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod" className="text-sm font-medium mb-2 block">
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                required
                defaultValue={paymentMethods && paymentMethods.length > 0 ? paymentMethods[0].code : 'cash'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    <option value="online">Online Payment</option>
                    <option value="cheque">Cheque</option>
                  </>
                )}
              </select>
              {(!paymentMethods || paymentMethods.length === 0) && (
                <p className="text-xs text-gray-500 mt-1">
                  Using default payment methods. Configure in settings.
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
                placeholder="Auto-generated if empty"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use invoice number as receipt number
              </p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Additional Information</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="customerNotes" className="text-sm font-medium mb-2 block">
                Customer Notes
              </Label>
              <Textarea
                id="customerNotes"
                name="customerNotes"
                placeholder="Notes visible to customer (e.g., thank you message, return policy)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                Internal Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Internal notes (not visible on invoice)"
                rows={2}
              />
            </div>
          </div>
        </div>

        {state.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isPending || !selectedCustomer}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? 'Recording Sale...' : 'Record Cash Sale'}
          </Button>
          <Link href="/sales/cash-sales">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </section>
  );
}
