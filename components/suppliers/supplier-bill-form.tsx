'use client';

import { useState, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SupplierSearch } from './supplier-search';
import { ProductSearchInline } from '@/components/invoices/product-search-inline';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createSupplierBill, updateSupplierBill } from '@/lib/supplier-bills/actions';
import useSWR from 'swr';
import type { Unit, TaxClassification } from '@/lib/db/schema';
import { useEffect } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Supplier {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
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
  gstClassification: string;
}

interface SupplierBillFormProps {
  defaultGstRate: string;
  editMode?: boolean;
  billId?: number;
  existingBill?: any;
}

export function SupplierBillForm({
  defaultGstRate,
  editMode = false,
  billId,
  existingBill,
}: SupplierBillFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [currency, setCurrency] = useState('BTN');
  const [notes, setNotes] = useState('');
  const { data: units } = useSWR<Unit[]>('/api/units', fetcher);
  const { data: taxClassifications } = useSWR<TaxClassification[]>('/api/tax-classifications', fetcher);

  // Default units fallback while API loads
  const defaultUnits = [
    { name: 'Piece', abbreviation: 'pcs' },
    { name: 'Kilogram', abbreviation: 'kg' },
    { name: 'Liter', abbreviation: 'L' },
    { name: 'Meter', abbreviation: 'm' },
    { name: 'Box', abbreviation: 'box' },
    { name: 'Dozen', abbreviation: 'doz' },
    { name: 'Hour', abbreviation: 'hr' },
    { name: 'Day', abbreviation: 'day' },
    { name: 'Month', abbreviation: 'mo' },
    { name: 'Year', abbreviation: 'yr' },
  ];

  const availableUnits = units || defaultUnits;

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: '1',
      unit: 'Piece',
      unitPrice: '',
      discountPercent: '0',
      taxRate: defaultGstRate,
      isTaxExempt: false,
      gstClassification: 'STANDARD',
    },
  ]);

  // Initialize form with existing bill data in edit mode
  useEffect(() => {
    if (editMode && existingBill) {
      setSelectedSupplier(existingBill.supplier);
      setBillNumber(existingBill.bill.billNumber);
      setBillDate(new Date(existingBill.bill.billDate));
      if (existingBill.bill.dueDate) {
        setDueDate(new Date(existingBill.bill.dueDate));
      }
      setCurrency(existingBill.bill.currency);
      setNotes(existingBill.bill.notes || '');

      // Map existing items to line items
      const items = existingBill.items.map((item: any) => ({
        id: crypto.randomUUID(),
        description: item.item.description,
        quantity: item.item.quantity,
        unit: item.item.unit || 'Piece',
        unitPrice: item.item.unitPrice,
        discountPercent: item.item.discountPercent || '0',
        taxRate: item.item.taxRate,
        isTaxExempt: item.item.isTaxExempt,
        gstClassification: item.item.gstClassification || 'STANDARD',
      }));
      setLineItems(items);
    }
  }, [editMode, existingBill]);

  const [state, formAction] = useActionState(
    editMode ? updateSupplierBill : createSupplierBill,
    { error: '' }
  );

  if (state.success && !editMode && state.billId) {
    router.push(`/purchases/bills/${state.billId}`);
  }

  if (state.success && editMode && billId) {
    router.push(`/purchases/bills/${billId}`);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedSupplier) {
      alert('Please select a supplier');
      return;
    }

    const validItems = lineItems.filter(item => item.description.trim() !== '');
    if (validItems.length === 0) {
      alert('Please add at least one item with a description');
      return;
    }

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

    const itemsData = validItems.map((item) => ({
      description: item.description,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      unitPrice: parseFloat(item.unitPrice),
      discountPercent: parseFloat(item.discountPercent) || 0,
      taxRate: parseFloat(item.taxRate) || 0,
      isTaxExempt: item.isTaxExempt,
      gstClassification: item.gstClassification,
    }));

    const cleanFormData = new FormData();
    if (editMode && billId) {
      cleanFormData.append('id', billId.toString());
    }
    cleanFormData.append('supplierId', selectedSupplier.id.toString());
    cleanFormData.append('billNumber', formData.get('billNumber') as string);
    cleanFormData.append('billDate', formData.get('billDate') as string);
    const dueDateValue = formData.get('dueDate');
    if (dueDateValue) cleanFormData.append('dueDate', dueDateValue as string);
    cleanFormData.append('currency', formData.get('currency') as string);
    cleanFormData.append('items', JSON.stringify(itemsData));

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
        unit: 'Piece',
        unitPrice: '',
        discountPercent: '0',
        taxRate: defaultGstRate,
        isTaxExempt: false,
        gstClassification: 'STANDARD',
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
              gstClassification: 'STANDARD',
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

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    lineItems.forEach((item) => {
      if (item.description.trim()) {
        const calc = calculateItemTotal(item);
        subtotal += calc.subtotal;
        totalDiscount += calc.discountAmount;
        totalTax += calc.taxAmount;
      }
    });

    const total = subtotal - totalDiscount + totalTax;

    return { subtotal, totalDiscount, totalTax, total };
  };

  const totals = calculateTotals();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-8">
        <Link
          href={editMode && billId ? `/purchases/bills/${billId}` : '/purchases/bills'}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {editMode ? 'Back to Bill' : 'Back to Bills'}
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">
          {editMode ? 'Edit Supplier Bill' : 'Create Supplier Bill'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-8">
        {/* Supplier and Bill Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Bill Details</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Supplier Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                Supplier Information
              </h3>

              <div>
                <SupplierSearch
                  onSelect={setSelectedSupplier}
                  selectedSupplier={selectedSupplier}
                />
                <input
                  type="hidden"
                  name="supplierId"
                  value={selectedSupplier?.id || ''}
                />
              </div>

              {selectedSupplier && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Selected Supplier
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSelectedSupplier(null)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Change
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900 font-semibold">{selectedSupplier.name}</p>
                    {selectedSupplier.gstNumber && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">GST:</span> {selectedSupplier.gstNumber}
                      </p>
                    )}
                    {selectedSupplier.email && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {selectedSupplier.email}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Bill Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                Bill Information
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="billNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                    Bill Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="billNumber"
                    name="billNumber"
                    type="text"
                    placeholder="Enter supplier's bill number"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the bill number from the supplier
                  </p>
                </div>

                <div>
                  <Label htmlFor="billDate" className="text-sm font-medium text-gray-700 mb-2 block">
                    Bill Date <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    id="billDate"
                    name="billDate"
                    date={billDate}
                    onDateChange={(date) => setBillDate(date || new Date())}
                    placeholder="Select bill date"
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
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
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
            <Button type="button" onClick={addLineItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
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
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">
                    Tax Class / GST Rate
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                    Total
                  </th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-700 uppercase tracking-wider w-12"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => {
                  const itemTotal = calculateItemTotal(item);
                  return (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <span className="text-sm text-gray-600">{index + 1}</span>
                      </td>
                      <td className="py-3 px-2">
                        <ProductSearchInline
                          value={item.description}
                          onChange={(value) =>
                            updateLineItem(item.id, 'description', value)
                          }
                          onProductSelect={(product) =>
                            handleProductSelect(item.id, product)
                          }
                          placeholder="Enter or search..."
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
                          onChange={(e) =>
                            updateLineItem(item.id, 'unit', e.target.value)
                          }
                          className="h-9 w-full px-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {availableUnits.map((unit) => (
                            <option key={unit.name} value={unit.name}>
                              {unit.name} ({unit.abbreviation})
                            </option>
                          ))}
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
                        <div className="space-y-1">
                          <select
                            value={item.gstClassification}
                            onChange={(e) => {
                              const classification = taxClassifications?.find(
                                (tc) => tc.code === e.target.value
                              );
                              updateLineItem(item.id, 'gstClassification', e.target.value);
                              if (classification) {
                                updateLineItem(item.id, 'taxRate', classification.taxRate);
                              }
                            }}
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
                                    value={classification.code}
                                  >
                                    {classification.name} ({classification.taxRate}%)
                                  </option>
                                ))
                            ) : (
                              <>
                                <option key="STANDARD" value="STANDARD">Standard (5%)</option>
                                <option key="ZERO_RATED" value="ZERO_RATED">Zero Rated (0%)</option>
                                <option key="EXEMPT" value="EXEMPT">Exempt (0%)</option>
                              </>
                            )}
                          </select>
                          <label className="flex items-center text-xs text-gray-600">
                            <input
                              type="checkbox"
                              checked={item.isTaxExempt}
                              onChange={(e) => {
                                updateLineItem(item.id, 'isTaxExempt', e.target.checked);
                                if (e.target.checked) {
                                  updateLineItem(item.id, 'taxRate', '0');
                                }
                              }}
                              className="mr-1"
                            />
                            Tax Exempt
                          </label>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {itemTotal.total.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(item.id)}
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bill Totals */}
          <div className="mt-8 pt-6 border-t-2 border-gray-300">
            <div className="flex justify-end">
              <div className="w-full max-w-md space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                  <span className="text-base font-semibold text-gray-900">
                    {totals.subtotal.toFixed(2)}
                  </span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Discount:</span>
                    <span className="text-base font-semibold text-green-600">
                      -{totals.totalDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total GST (Input):</span>
                  <span className="text-base font-semibold text-gray-900">
                    {totals.totalTax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                  <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add any additional notes about this bill..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional internal notes about this bill
            </p>
          </div>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{state.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 pb-8">
          <Link href={editMode && billId ? `/purchases/bills/${billId}` : '/purchases/bills'}>
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 min-w-[160px]"
          >
            {isPending
              ? editMode
                ? 'Updating Bill...'
                : 'Creating Bill...'
              : editMode
              ? 'Update Bill'
              : 'Create Bill'}
          </Button>
        </div>
      </form>
    </section>
  );
}
