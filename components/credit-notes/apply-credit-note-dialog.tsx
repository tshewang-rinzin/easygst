'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Loader2 } from 'lucide-react';
import { applyCreditNote } from '@/lib/credit-notes/actions';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amountDue: string;
  currency: string;
}

interface ApplyCreditNoteDialogProps {
  creditNoteId: string;
  creditNoteNumber: string;
  customerId: string;
  currency: string;
  unappliedAmount: string;
}

export function ApplyCreditNoteDialog({
  creditNoteId,
  creditNoteNumber,
  customerId,
  currency,
  unappliedAmount,
}: ApplyCreditNoteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');

  // Fetch unpaid invoices for this customer when dialog opens
  useEffect(() => {
    if (open && customerId) {
      setLoadingInvoices(true);
      fetch(`/api/customers/${customerId}/outstanding-invoices`)
        .then((res) => res.json())
        .then((data) => {
          setInvoices(data || []);
          setLoadingInvoices(false);
        })
        .catch(() => {
          setLoadingInvoices(false);
        });
    }
  }, [open, customerId]);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);
  const maxAmount = Math.min(
    parseFloat(unappliedAmount),
    selectedInvoice ? parseFloat(selectedInvoice.amountDue) : 0
  );

  const handleApply = async () => {
    if (!selectedInvoiceId) {
      setError('Please select an invoice');
      return;
    }

    const applyAmount = parseFloat(amount);
    if (isNaN(applyAmount) || applyAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (applyAmount > maxAmount) {
      setError(`Amount cannot exceed ${currency} ${maxAmount.toFixed(2)}`);
      return;
    }

    setError('');

    startTransition(async () => {
      const formData = new FormData();
      formData.append('creditNoteId', creditNoteId);
      formData.append('invoiceId', selectedInvoiceId);
      formData.append('amount', amount);

      const result = await applyCreditNote({}, formData);

      if ('error' in result && result.error) {
        setError(result.error);
      } else if ('success' in result && result.success) {
        setOpen(false);
        setSelectedInvoiceId('');
        setAmount('');
        router.refresh();
      }
    });
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      // Set amount to the lesser of unapplied amount or invoice amount due
      const suggestedAmount = Math.min(
        parseFloat(unappliedAmount),
        parseFloat(invoice.amountDue)
      );
      setAmount(suggestedAmount.toFixed(2));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          <CreditCard className="h-4 w-4 mr-2" />
          Apply to Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Credit Note</DialogTitle>
          <DialogDescription>
            Apply {creditNoteNumber} to an unpaid invoice.
            <br />
            Available balance: {currency} {parseFloat(unappliedAmount).toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invoice">Select Invoice</Label>
            {loadingInvoices ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                No unpaid invoices found for this customer.
              </p>
            ) : (
              <Select value={selectedInvoiceId} onValueChange={handleInvoiceSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - Due: {currency} {parseFloat(invoice.amountDue).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedInvoice && (
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Apply</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Max: ${currency} ${maxAmount.toFixed(2)}`}
              />
              <p className="text-xs text-gray-500">
                Maximum amount: {currency} {maxAmount.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={isPending || !selectedInvoiceId || !amount}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              'Apply Credit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
