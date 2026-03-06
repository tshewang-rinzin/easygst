'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Send, Download, CreditCard, Copy, Bell } from 'lucide-react';
import { useActionState } from 'react';
import { sendTourInvoice, recordTourInvoicePayment, duplicateTourInvoice, sendTourInvoiceReminder } from '../actions';
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, setIsPending] = useState(false);

  const handleSend = async () => {
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append('id', invoiceId);
      const result = await sendTourInvoice({ id: invoiceId }, formData);
      if ('error' in result && result.error) {
        toast.error(result.error as string);
      } else {
        toast.success('Tour invoice sent successfully');
      }
    } catch (err) {
      toast.error('Failed to send invoice');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSend} disabled={isPending}>
      <Send className="mr-1 h-4 w-4" /> {isPending ? 'Sending...' : 'Send'}
    </Button>
  );
}

export function DownloadPDFButton({ invoiceId }: { invoiceId: string }) {
  return (
    <a href={`/api/tour-invoices/${invoiceId}/pdf`} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size="sm">
        <Download className="mr-1 h-4 w-4" /> PDF
      </Button>
    </a>
  );
}

export function RecordPaymentButton({
  invoiceId,
  currency,
}: {
  invoiceId: string;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await recordTourInvoicePayment(
        {
          tourInvoiceId: invoiceId,
          amount: formData.get('amount') as string,
          currency: formData.get('currency') as string,
          paymentDate: formData.get('paymentDate') as string,
          paymentMethod: formData.get('paymentMethod') as string,
          transactionId: (formData.get('transactionId') as string) || undefined,
          bankName: (formData.get('bankName') as string) || undefined,
          notes: (formData.get('notes') as string) || undefined,
        },
        formData
      );

      if ('error' in result && result.error) {
        toast.error(result.error as string);
      } else {
        toast.success('Payment recorded');
        setOpen(false);
      }
    } catch (err) {
      toast.error('Failed to record payment');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CreditCard className="mr-1 h-4 w-4" /> Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue={currency} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                name="paymentDate"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="mbob">mBoB</option>
                <option value="mpay">mPay</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="transactionId">Transaction ID (optional)</Label>
            <Input id="transactionId" name="transactionId" />
          </div>
          <div>
            <Label htmlFor="bankName">Bank Name (optional)</Label>
            <Input id="bankName" name="bankName" />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Recording...' : 'Record Payment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DuplicateInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleDuplicate = async () => {
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append('id', invoiceId);
      const result = await duplicateTourInvoice({ id: invoiceId }, formData);
      if ('error' in result && result.error) {
        toast.error(result.error as string);
      } else if ('invoiceId' in result && result.invoiceId) {
        toast.success('Tour invoice duplicated');
        router.push(`/tour-invoices/${result.invoiceId}`);
      }
    } catch {
      toast.error('Failed to duplicate invoice');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isPending}>
      <Copy className="mr-1 h-4 w-4" /> {isPending ? 'Duplicating...' : 'Duplicate'}
    </Button>
  );
}

export function SendReminderButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, setIsPending] = useState(false);

  const handleReminder = async () => {
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append('id', invoiceId);
      const result = await sendTourInvoiceReminder({ id: invoiceId }, formData);
      if ('error' in result && result.error) {
        toast.error(result.error as string);
      } else {
        toast.success('Payment reminder sent');
      }
    } catch {
      toast.error('Failed to send reminder');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleReminder} disabled={isPending}>
      <Bell className="mr-1 h-4 w-4" /> {isPending ? 'Sending...' : 'Send Reminder'}
    </Button>
  );
}
