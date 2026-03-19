'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createExpense, updateExpense } from '@/lib/expenses/actions';
import type { ExpenseCategory } from '@/lib/db/schema';

interface Supplier {
  id: string;
  name: string;
}

interface ExpenseFormProps {
  categories: ExpenseCategory[];
  suppliers: Supplier[];
  expense?: {
    id: string;
    expenseCategoryId: string;
    supplierId: string | null;
    expenseDate: Date;
    description: string;
    referenceNumber: string | null;
    currency: string;
    amount: string | null;
    gstRate: string | null;
    paymentMethod: string | null;
    paymentDate: Date | null;
    isPaid: boolean;
    paidFromAccount: string | null;
    isRecurring: boolean;
    recurringFrequency: string | null;
    notes: string | null;
  } | null;
}

export function ExpenseForm({ categories, suppliers, expense }: ExpenseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!expense;

  const [categoryId, setCategoryId] = useState(expense?.expenseCategoryId || '');
  const [amount, setAmount] = useState(expense?.amount || '');
  const [gstRate, setGstRate] = useState(expense?.gstRate || '0');
  const [isPaid, setIsPaid] = useState(expense?.isPaid || false);
  const [isRecurring, setIsRecurring] = useState(expense?.isRecurring || false);

  // Auto-fill GST rate from category
  useEffect(() => {
    if (categoryId && !isEditing) {
      const cat = categories.find((c) => c.id === categoryId);
      if (cat) {
        setGstRate(cat.defaultGstRate as string);
      }
    }
  }, [categoryId, categories, isEditing]);

  const gstAmount = (parseFloat(amount || '0') * parseFloat(gstRate || '0')) / 100;
  const totalAmount = parseFloat(amount || '0') + gstAmount;
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const claimablePercentage = parseFloat((selectedCategory?.claimablePercentage as string) || '0');
  const claimableGst = (gstAmount * claimablePercentage) / 100;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('isPaid', isPaid ? 'true' : 'false');
    formData.set('isRecurring', isRecurring ? 'true' : 'false');

    startTransition(async () => {
      const action = isEditing ? updateExpense : createExpense;
      const result = await action({}, formData);
      if (result && 'error' in result) {
        toast.error(result.error as string);
      } else {
        toast.success(isEditing ? 'Expense updated' : 'Expense created');
        router.push(isEditing ? `/expenses/${expense!.id}` : '/expenses');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {isEditing && <input type="hidden" name="id" value={expense!.id} />}

      <div className="grid gap-6 max-w-3xl">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expenseCategoryId">Category *</Label>
              <Select name="expenseCategoryId" value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expenseDate">Date *</Label>
                <Input
                  type="date"
                  name="expenseDate"
                  defaultValue={expense ? new Date(expense.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input name="referenceNumber" defaultValue={expense?.referenceNumber || ''} placeholder="Bill/receipt number" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea name="description" defaultValue={expense?.description || ''} placeholder="What is this expense for?" required />
            </div>
          </CardContent>
        </Card>

        {/* Amount */}
        <Card>
          <CardHeader>
            <CardTitle>Amount</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <input type="hidden" name="currency" value="BTN" />
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (before GST) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gstRate">GST Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  name="gstRate"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="text-gray-500">GST Amount</Label>
                <div className="p-2 bg-gray-50 rounded text-sm font-medium">{gstAmount.toFixed(2)}</div>
              </div>
              <div className="grid gap-2">
                <Label className="text-gray-500">Total</Label>
                <div className="p-2 bg-gray-50 rounded text-sm font-bold">{totalAmount.toFixed(2)}</div>
              </div>
              <div className="grid gap-2">
                <Label className="text-gray-500">Claimable GST</Label>
                <div className="p-2 bg-green-50 rounded text-sm font-medium text-green-700">
                  {claimableGst.toFixed(2)}
                  {selectedCategory && (
                    <span className="text-xs text-gray-400 ml-1">({claimablePercentage}%)</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select name="paymentMethod" defaultValue={expense?.paymentMethod || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  type="date"
                  name="paymentDate"
                  defaultValue={expense?.paymentDate ? new Date(expense.paymentDate).toISOString().split('T')[0] : ''}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPaid"
                checked={isPaid}
                onCheckedChange={(checked) => setIsPaid(!!checked)}
              />
              <Label htmlFor="isPaid">Paid</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paidFromAccount">Paid From Account</Label>
              <Input name="paidFromAccount" defaultValue={expense?.paidFromAccount || ''} placeholder="Bank account name/reference" />
            </div>
          </CardContent>
        </Card>

        {/* Supplier */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Select name="supplierId" defaultValue={expense?.supplierId || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier (optional)" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Recurring */}
        <Card>
          <CardHeader>
            <CardTitle>Recurring</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(!!checked)}
              />
              <Label htmlFor="isRecurring">This is a recurring expense</Label>
            </div>
            {isRecurring && (
              <Select name="recurringFrequency" defaultValue={expense?.recurringFrequency || 'monthly'}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea name="notes" defaultValue={expense?.notes || ''} placeholder="Additional notes..." rows={3} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="bg-amber-500 hover:bg-amber-800" disabled={isPending}>
            {isPending ? 'Saving...' : isEditing ? 'Update Expense' : 'Create Expense'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
