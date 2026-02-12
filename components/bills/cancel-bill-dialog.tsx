'use client';

import { useState, useTransition } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Ban, AlertTriangle } from 'lucide-react';
import { cancelSupplierBill } from '@/lib/supplier-bills/actions';

interface CancelBillDialogProps {
  billId: string;
  billNumber: string;
  hasPayments: boolean;
  amountPaid: string;
  currency: string;
}

export function CancelBillDialog({
  billId,
  billNumber,
  hasPayments,
  amountPaid,
  currency,
}: CancelBillDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    setError('');

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', billId);
      formData.append('reason', reason);

      const result = await cancelSupplierBill({}, formData);

      if ('error' in result && result.error) {
        setError(result.error);
      } else if ('success' in result && result.success) {
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50">
          <Ban className="h-4 w-4 mr-2" />
          Cancel Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Cancel Bill
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel bill {billNumber}?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {hasPayments && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This bill has {currency} {parseFloat(amountPaid).toFixed(2)} in payments.
                These payments will be automatically reversed and returned to the supplier advance balance.
              </p>
            </div>
          )}

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Important:</strong> Cancelled bills cannot be edited or restored.
              The bill number will be preserved for audit purposes.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Cancellation *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Entered incorrect supplier, duplicate bill, supplier invoice error..."
              className="min-h-[100px]"
              disabled={isPending}
            />
          </div>
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
            Keep Bill
          </Button>
          <Button
            type="button"
            onClick={handleCancel}
            disabled={isPending || !reason.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isPending ? 'Cancelling...' : 'Cancel Bill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
