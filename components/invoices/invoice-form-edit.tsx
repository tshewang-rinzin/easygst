'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProductSearchInline } from './product-search-inline';
import { QuickAddProductDialog } from '@/components/products/quick-add-product-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { updateInvoice } from '@/lib/invoices/actions';
import useSWR from 'swr';
import type { Unit, TaxClassification } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string | null;
  unitPrice: string;
  unit: string;
  defaultTaxRate: string;
  isTaxExempt: boolean;
}

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

interface InvoiceData {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customer: Customer;
  invoiceDate: Date;
  dueDate: Date | null;
  currency: string;
  items: Array<{
    description: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    discountPercent: string;
    taxRate: string;
    isTaxExempt: boolean;
  }>;
  paymentTerms: string | null;
  notes: string | null;
  customerNotes: string | null;
}

interface InvoiceFormEditProps {
  invoice: InvoiceData;
  defaultGstRate: string;
}

export function InvoiceFormEdit({ invoice, defaultGstRate }: InvoiceFormEditProps) {
  const router = useRouter();
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date(invoice.invoiceDate));
  const [dueDate, setDueDate] = useState<Date | undefined>(
    invoice.dueDate ? new Date(invoice.dueDate) : undefined
  );
  const { data: units } = useSWR<Unit[]>('/api/units', fetcher);
  const { data: taxClassifications } = useSWR<TaxClassification[]>('/api/tax-classifications', fetcher);
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice.items.map((item) => ({
      id: crypto.randomUUID(),
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'piece',
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent || '0',
      taxRate: item.taxRate || defaultGstRate,
      isTaxExempt: item.isTaxExempt,
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate at least one item with description
    const validItems = lineItems.filter((item) => item.description.trim() !== '');
    if (validItems.length === 0) {
      alert('Please add at least one item with a description');
      return;
    }

    // Validate each item has required fields
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

    setIsSubmitting(true);

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

    // Create clean FormData with proper structure
    const cleanFormData = new FormData();
    cleanFormData.append('id', invoice.id.toString());
    cleanFormData.append('customerId', invoice.customerId.toString());
    cleanFormData.append('invoiceDate', formData.get('invoiceDate') as string);
    const dueDate = formData.get('dueDate');
    if (dueDate) cleanFormData.append('dueDate', dueDate as string);
    cleanFormData.append('currency', formData.get('currency') as string);

    // Append items as JSON string
    cleanFormData.append('items', JSON.stringify(itemsData));

    const paymentTerms = formData.get('paymentTerms');
    if (paymentTerms) cleanFormData.append('paymentTerms', paymentTerms as string);
    const customerNotes = formData.get('customerNotes');
    if (customerNotes) cleanFormData.append('customerNotes', customerNotes as string);
    const notes = formData.get('notes');
    if (notes) cleanFormData.append('notes', notes as string);

    const result = await updateInvoice({}, cleanFormData);

    setIsSubmitting(false);

    if ('success' in result && result.success) {
      router.push(`/invoices/${invoice.id}`);
    } else if ('error' in result && result.error) {
      setError(result.error);
    }
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
    const total = afterDiscount + taxAmount;

    return total;
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
          href={`/invoices/${invoice.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Invoice
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          Edit Invoice {invoice.invoiceNumber}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-8">
        {/* Invoice Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Invoice Details</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Customer Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                Customer Information
              </h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-900 font-semibold">{invoice.customer.name}</p>
                  {invoice.customer.email && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {invoice.customer.email}
                    </p>
                  )}
                  {invoice.customer.phone && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span> {invoice.customer.phone}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Customer cannot be changed when editing an invoice
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Invoice Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                Invoice Information
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="invoiceDate" className="text-sm font-medium text-gray-700 mb-2 block">
                    Invoice Date <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    id="invoiceDate"
                    name="invoiceDate"
                    date={invoiceDate}
                    onDateChange={(date) => setInvoiceDate(date || new Date())}
                    placeholder="Select invoice date"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700 mb-2 block">
                    Due Date
                  </Label>
                  <DatePicker
                    id="dueDate"
                    name="dueDate"
                    date={dueDate}
                    onDateChange={setDueDate}
                    placeholder="Select due date (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="currency" className="text-sm font-medium text-gray-700 mb-2 block">
                    Currency <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="currency"
                    name="currency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    defaultValue={invoice.currency}
                  >
                    <option value="BTN">BTN - Ngultrum</option>
                    <option value="INR">INR - Rupee</option>
                    <option value="USD">USD - Dollar</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-gray-900">Items</h2>
            <div className="flex gap-2">
              <Button type="button" onClick={addLineItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
              <QuickAddProductDialog defaultGstRate={defaultGstRate} />
            </div>
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
                        onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={item.unit}
                        onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                        className="w-full h-9 px-2 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {units && units.length > 0 ? (
                          units.map((unit) => (
                            <option key={unit.id} value={unit.name}>
                              {unit.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="piece">Piece</option>
                            <option value="hour">Hour</option>
                            <option value="day">Day</option>
                            <option value="month">Month</option>
                            <option value="kg">Kg</option>
                            <option value="service">Service</option>
                          </>
                        )}
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value)}
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
                          onClick={() => removeLineItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
          <div className="mt-8 pt-6 border-t border-gray-300">
            <div className="flex justify-end">
              <div className="w-full md:w-2/5 space-y-3 bg-gray-50 p-5 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">{totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span className="font-semibold">-{totals.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST:</span>
                  <span className="font-semibold text-gray-900">{totals.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
                  <span>Total:</span>
                  <span className="text-orange-600">{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Additional Notes</h2>

          <div className="space-y-5">
            <div>
              <Label htmlFor="paymentTerms" className="text-sm font-medium text-gray-700 mb-2 block">
                Payment Terms
              </Label>
              <Textarea
                id="paymentTerms"
                name="paymentTerms"
                placeholder="e.g., Payment due within 30 days"
                rows={2}
                className="resize-none"
                defaultValue={invoice.paymentTerms || ''}
              />
            </div>
            <div>
              <Label htmlFor="customerNotes" className="text-sm font-medium text-gray-700 mb-2 block">
                Customer Notes
              </Label>
              <Textarea
                id="customerNotes"
                name="customerNotes"
                placeholder="Notes visible to customer on the invoice"
                rows={2}
                className="resize-none"
                defaultValue={invoice.customerNotes || ''}
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
                Internal Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Private notes (not visible to customer)"
                rows={2}
                className="resize-none"
                defaultValue={invoice.notes || ''}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-4 pb-8">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? 'Updating Invoice...' : 'Update Invoice'}
          </Button>
          <Link href={`/invoices/${invoice.id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </section>
  );
}
