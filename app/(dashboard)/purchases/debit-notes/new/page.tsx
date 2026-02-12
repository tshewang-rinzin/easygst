'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, Plus, Trash2, Loader2, FileText } from 'lucide-react';
import { createDebitNote } from '@/lib/debit-notes/actions';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Supplier {
  id: string;
  name: string;
  email: string | null;
}

interface Bill {
  id: string;
  billNumber: string;
  totalAmount: string;
  currency: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  taxRate: string;
}

export default function NewDebitNotePage() {
  return (
    <Suspense fallback={
      <section className="flex-1 p-4 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </section>
    }>
      <NewDebitNoteContent />
    </Suspense>
  );
}

function NewDebitNoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const billIdParam = searchParams.get('billId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedBillId, setSelectedBillId] = useState(billIdParam || '');
  const [debitNoteDate, setDebitNoteDate] = useState<Date>(new Date());
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');
  const [currency, setCurrency] = useState('BTN');

  const { data: suppliers } = useSWR<Supplier[]>('/api/suppliers', fetcher);
  const { data: supplierBills } = useSWR<Bill[]>(
    selectedSupplierId ? `/api/suppliers/${selectedSupplierId}/bills` : null,
    fetcher
  );

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: '1',
      unit: 'piece',
      unitPrice: '',
      taxRate: '0',
    },
  ]);

  // If billId is provided, fetch the bill details
  useEffect(() => {
    if (billIdParam) {
      fetch(`/api/bills/${billIdParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.bill) {
            setSelectedSupplierId(data.bill.supplierId);
            setSelectedBillId(data.bill.id);
            setCurrency(data.bill.currency);
            // Pre-fill items from bill
            if (data.items && data.items.length > 0) {
              setLineItems(
                data.items.map((item: any) => ({
                  id: crypto.randomUUID(),
                  description: item.description,
                  quantity: item.quantity,
                  unit: item.unit || 'piece',
                  unitPrice: item.unitPrice,
                  taxRate: item.taxRate,
                }))
              );
            }
          }
        })
        .catch(console.error);
    }
  }, [billIdParam]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: '1',
        unit: 'piece',
        unitPrice: '',
        taxRate: '0',
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateLineTotal = (item: LineItem) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    const subtotal = qty * price;
    const tax = subtotal * (taxRate / 100);
    return subtotal + tax;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    lineItems.forEach((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const taxRate = parseFloat(item.taxRate) || 0;
      const lineSubtotal = qty * price;
      const lineTax = lineSubtotal * (taxRate / 100);
      subtotal += lineSubtotal;
      totalTax += lineTax;
    });

    return {
      subtotal,
      totalTax,
      total: subtotal + totalTax,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedSupplierId) {
      setError('Please select a supplier');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the debit note');
      return;
    }

    const validItems = lineItems.filter(
      (item) => item.description.trim() && parseFloat(item.unitPrice) > 0
    );

    if (validItems.length === 0) {
      setError('Please add at least one valid item');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('supplierId', selectedSupplierId);
    if (selectedBillId) {
      formData.append('billId', selectedBillId);
    }
    formData.append('debitNoteDate', debitNoteDate.toISOString());
    formData.append('currency', currency);
    formData.append('reason', reason);
    if (notes) formData.append('notes', notes);
    if (supplierNotes) formData.append('supplierNotes', supplierNotes);

    const itemsData = validItems.map((item) => ({
      description: item.description,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      unitPrice: parseFloat(item.unitPrice),
      taxRate: parseFloat(item.taxRate),
      gstClassification: 'STANDARD',
    }));
    formData.append('items', JSON.stringify(itemsData));

    const result = await createDebitNote({}, formData);

    setIsSubmitting(false);

    if ('success' in result && result.success && 'debitNoteId' in result) {
      router.push(`/purchases/debit-notes/${result.debitNoteId}`);
    } else if ('error' in result && result.error) {
      setError(result.error);
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/purchases/debit-notes"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Debit Notes
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6" />
          New Debit Note
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a debit note to adjust or reduce a supplier bill
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Supplier & Bill Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier & Bill</CardTitle>
            <CardDescription>
              Select the supplier and optionally link to an existing bill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select
                  value={selectedSupplierId}
                  onValueChange={setSelectedSupplierId}
                  disabled={!!billIdParam}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bill">Original Bill (Optional)</Label>
                <Select
                  value={selectedBillId}
                  onValueChange={setSelectedBillId}
                  disabled={!selectedSupplierId || !!billIdParam}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bill (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No bill reference</SelectItem>
                    {supplierBills?.map((bill) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        {bill.billNumber} - {bill.currency} {parseFloat(bill.totalAmount).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Debit Note Date *</Label>
                <DatePicker
                  date={debitNoteDate}
                  onDateChange={(date) => date && setDebitNoteDate(date)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTN">BTN</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reason */}
        <Card>
          <CardHeader>
            <CardTitle>Reason for Debit</CardTitle>
            <CardDescription>
              Explain why this debit note is being issued
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Goods returned to supplier, pricing error, quality issues..."
              className="min-h-[100px]"
              required
            />
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Items</CardTitle>
                <CardDescription>Add items being debited</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-start p-4 bg-gray-50 rounded-lg"
                >
                  <div className="col-span-12 md:col-span-4">
                    <Label className="text-xs text-gray-500">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Label className="text-xs text-gray-500">Qty</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Label className="text-xs text-gray-500">Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <Label className="text-xs text-gray-500">Tax %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={item.taxRate}
                      onChange={(e) => updateLineItem(item.id, 'taxRate', e.target.value)}
                    />
                  </div>
                  <div className="col-span-9 md:col-span-2 flex items-end justify-between">
                    <div>
                      <Label className="text-xs text-gray-500">Total</Label>
                      <p className="font-medium text-gray-900">
                        {currency} {calculateLineTotal(item).toFixed(2)}
                      </p>
                    </div>
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
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-full md:w-1/3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{currency} {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">{currency} {totals.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total Debit:</span>
                  <span className="text-red-600">-{currency} {totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplierNotes">Supplier Notes</Label>
              <Textarea
                id="supplierNotes"
                value={supplierNotes}
                onChange={(e) => setSupplierNotes(e.target.value)}
                placeholder="Notes visible to the supplier..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes (not visible to supplier)..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/purchases/debit-notes">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Debit Note'
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
