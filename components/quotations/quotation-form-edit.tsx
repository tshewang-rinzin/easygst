'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomerSearch } from '@/components/invoices/customer-search';
import { ProductSearchInline } from '@/components/invoices/product-search-inline';
import { QuickAddProductDialog } from '@/components/products/quick-add-product-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { updateQuotation } from '@/lib/quotations/actions';
import useSWR from 'swr';
import type { Unit, TaxClassification } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface QuotationData {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  quotationDate: Date;
  validUntil: Date | null;
  currency: string;
  notes: string;
  customerNotes: string;
  termsAndConditions: string;
  items: {
    productId?: string;
    description: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    discountPercent: string;
    taxRate: string;
    isTaxExempt: boolean;
  }[];
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Product {
  id: string;
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

export function QuotationFormEdit({
  quotation,
  defaultGstRate,
}: {
  quotation: QuotationData;
  defaultGstRate: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>({
    id: quotation.customerId,
    name: quotation.customerName,
    email: quotation.customerEmail,
    phone: quotation.customerPhone,
  });
  const [quotationDate, setQuotationDate] = useState<Date>(new Date(quotation.quotationDate));
  const [validUntil, setValidUntil] = useState<Date | undefined>(
    quotation.validUntil ? new Date(quotation.validUntil) : undefined
  );
  const { data: units } = useSWR<Unit[]>('/api/units', fetcher);
  const { data: taxClassifications } = useSWR<TaxClassification[]>('/api/tax-classifications', fetcher);
  const [lineItems, setLineItems] = useState<LineItem[]>(
    quotation.items.map((item) => ({
      id: crypto.randomUUID(),
      description: item.description,
      quantity: parseFloat(item.quantity).toString(),
      unit: item.unit,
      unitPrice: parseFloat(item.unitPrice).toFixed(2),
      discountPercent: parseFloat(item.discountPercent).toString(),
      taxRate: parseFloat(item.taxRate).toString(),
      isTaxExempt: item.isTaxExempt,
    }))
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    const validItems = lineItems.filter(item => item.description.trim() !== '');
    if (validItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setIsSubmitting(true);

    const itemsData = validItems.map((item) => ({
      description: item.description,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      unitPrice: parseFloat(item.unitPrice),
      discountPercent: parseFloat(item.discountPercent) || 0,
      taxRate: parseFloat(item.taxRate) || 0,
      isTaxExempt: item.isTaxExempt,
    }));

    const form = e.currentTarget;
    const formData = new FormData();
    formData.append('id', quotation.id);
    formData.append('customerId', selectedCustomer.id);
    formData.append('quotationDate', quotationDate.toISOString());
    if (validUntil) formData.append('validUntil', validUntil.toISOString());
    formData.append('currency', (form.elements.namedItem('currency') as HTMLSelectElement).value);
    formData.append('items', JSON.stringify(itemsData));

    const customerNotes = (form.elements.namedItem('customerNotes') as HTMLTextAreaElement)?.value;
    if (customerNotes) formData.append('customerNotes', customerNotes);
    const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement)?.value;
    if (notes) formData.append('notes', notes);
    const terms = (form.elements.namedItem('termsAndConditions') as HTMLTextAreaElement)?.value;
    if (terms) formData.append('termsAndConditions', terms);

    const result = await updateQuotation({}, formData);
    setIsSubmitting(false);

    if ('success' in result && result.success) {
      router.push(`/quotations/${quotation.id}`);
    } else if ('error' in result && result.error) {
      setError(result.error);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: crypto.randomUUID(), description: '', quantity: '1', unit: 'piece',
      unitPrice: '', discountPercent: '0', taxRate: defaultGstRate, isTaxExempt: false,
    }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | boolean) => {
    setLineItems(lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleProductSelect = (id: string, product: Product) => {
    setLineItems(lineItems.map((item) =>
      item.id === id ? { ...item, description: product.name, unitPrice: parseFloat(product.unitPrice).toFixed(2), unit: product.unit, taxRate: product.defaultTaxRate, isTaxExempt: product.isTaxExempt } : item
    ));
  };

  const calculateItemTotal = (item: LineItem) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discountPercent) || 0;
    const taxRate = item.isTaxExempt ? 0 : parseFloat(item.taxRate) || 0;
    const subtotal = qty * price;
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    return afterDiscount + afterDiscount * (taxRate / 100);
  };

  const calculateTotals = () => {
    let subtotal = 0, totalDiscount = 0, totalTax = 0;
    lineItems.forEach((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const discount = parseFloat(item.discountPercent) || 0;
      const taxRate = item.isTaxExempt ? 0 : parseFloat(item.taxRate) || 0;
      const s = qty * price;
      const d = s * (discount / 100);
      const ad = s - d;
      subtotal += s; totalDiscount += d; totalTax += ad * (taxRate / 100);
    });
    return { subtotal, totalDiscount, totalTax, total: subtotal - totalDiscount + totalTax };
  };

  const totals = calculateTotals();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-8">
        <Link href={`/quotations/${quotation.id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />Back to Quotation
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Edit Quotation {quotation.quotationNumber}</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Quotation Details</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Customer Information</h3>
              <CustomerSearch onSelect={setSelectedCustomer} selectedCustomer={selectedCustomer} />
              {selectedCustomer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Selected Customer</h4>
                    <button type="button" onClick={() => setSelectedCustomer(null)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Change</button>
                  </div>
                  <p className="text-sm text-gray-900 font-semibold">{selectedCustomer.name}</p>
                  {selectedCustomer.email && <p className="text-sm text-gray-600">{selectedCustomer.email}</p>}
                  {selectedCustomer.phone && <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Quotation Information</h3>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Quotation Date <span className="text-red-500">*</span></Label>
                <DatePicker id="quotationDate" name="quotationDate" date={quotationDate} onDateChange={(date) => setQuotationDate(date || new Date())} required />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Valid Until</Label>
                <DatePicker id="validUntil" name="validUntil" date={validUntil} onDateChange={setValidUntil} />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Currency</Label>
                <select id="currency" name="currency" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" defaultValue={quotation.currency}>
                  <option value="BTN">BTN - Ngultrum</option>
                  <option value="INR">INR - Rupee</option>
                  <option value="USD">USD - Dollar</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold text-gray-900">Items</h2>
            <div className="flex gap-2">
              <Button type="button" onClick={addLineItem} variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />Add Line Item</Button>
              <QuickAddProductDialog defaultGstRate={defaultGstRate} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase w-8">#</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase min-w-[200px]">Description *</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase w-24">Qty *</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase w-24">Unit</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase w-28">Price *</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase w-24">Disc %</th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 uppercase w-32">GST Rate</th>
                  <th className="text-center py-3 px-2 text-xs font-semibold text-gray-700 uppercase w-20">Exempt</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-700 uppercase w-28">Total</th>
                  <th className="py-3 px-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-2"><span className="text-sm font-medium text-gray-600">{index + 1}</span></td>
                    <td className="py-3 px-2">
                      <ProductSearchInline value={item.description} onChange={(v) => updateLineItem(item.id, 'description', v)} onSelect={(p) => handleProductSelect(item.id, p)} index={index} required={false} />
                    </td>
                    <td className="py-3 px-2"><Input type="number" step="0.01" min="0.01" value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)} className="h-9 text-sm" /></td>
                    <td className="py-3 px-2">
                      <select value={item.unit} onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)} className="w-full h-9 px-2 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                        {units && units.length > 0 ? units.map((u) => (<option key={u.id} value={u.name}>{u.name}</option>)) : (
                          <><option value="piece">Piece</option><option value="hour">Hour</option><option value="day">Day</option><option value="month">Month</option><option value="kg">Kg</option><option value="service">Service</option></>
                        )}
                      </select>
                    </td>
                    <td className="py-3 px-2"><Input type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value)} placeholder="0.00" className="h-9 text-sm" /></td>
                    <td className="py-3 px-2"><Input type="number" step="0.01" min="0" max="100" value={item.discountPercent} onChange={(e) => updateLineItem(item.id, 'discountPercent', e.target.value)} className="h-9 text-sm" /></td>
                    <td className="py-3 px-2">
                      <select value={item.taxRate} onChange={(e) => updateLineItem(item.id, 'taxRate', e.target.value)} disabled={item.isTaxExempt} className="w-full h-9 px-2 py-1 border border-gray-300 rounded-md text-sm bg-white disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                        {taxClassifications && taxClassifications.length > 0 ? taxClassifications.sort((a, b) => a.sortOrder - b.sortOrder).filter((tc) => tc.isActive).map((c) => (
                          <option key={c.id} value={parseFloat(c.taxRate).toString()}>{c.name} ({parseFloat(c.taxRate)}%)</option>
                        )) : (<><option value="0">0%</option><option value="5">5%</option><option value="10">10%</option><option value="20">20%</option><option value="30">30%</option><option value="50">50%</option></>)}
                      </select>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <input type="checkbox" checked={item.isTaxExempt} onChange={(e) => updateLineItem(item.id, 'isTaxExempt', e.target.checked)} className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer" />
                    </td>
                    <td className="py-3 px-2 text-right"><span className="text-sm font-semibold text-gray-900">{calculateItemTotal(item).toFixed(2)}</span></td>
                    <td className="py-3 px-2 text-center">
                      {lineItems.length > 1 && (
                        <Button type="button" onClick={() => removeLineItem(item.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-300">
            <div className="flex justify-end">
              <div className="w-full md:w-2/5 space-y-3 bg-gray-50 p-5 rounded-lg">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal:</span><span className="font-semibold">{totals.subtotal.toFixed(2)}</span></div>
                {totals.totalDiscount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount:</span><span className="font-semibold">-{totals.totalDiscount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-gray-600">GST:</span><span className="font-semibold">{totals.totalTax.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3"><span>Total:</span><span className="text-orange-600">{totals.total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Additional Notes</h2>
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Customer Notes</Label>
              <Textarea name="customerNotes" defaultValue={quotation.customerNotes} placeholder="Notes visible to customer" rows={2} className="resize-none" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Terms & Conditions</Label>
              <Textarea name="termsAndConditions" defaultValue={quotation.termsAndConditions} placeholder="Terms and conditions" rows={3} className="resize-none" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Internal Notes</Label>
              <Textarea name="notes" defaultValue={quotation.notes} placeholder="Private notes" rows={2} className="resize-none" />
            </div>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm font-medium text-red-600">{error}</p></div>}

        <div className="flex gap-4 pb-8">
          <Button type="submit" disabled={isSubmitting || !selectedCustomer} className="bg-orange-500 hover:bg-orange-600">
            {isSubmitting ? 'Saving...' : 'Save Quotation'}
          </Button>
          <Link href={`/quotations/${quotation.id}`}><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </section>
  );
}
