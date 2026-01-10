'use client';

import { useState, useTransition } from 'react';
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
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendPaymentReminderEmail } from '@/lib/email/actions';

interface SendReminderButtonProps {
  invoiceId: number;
  invoiceNumber: string;
  customerEmail?: string | null;
  paymentStatus: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export function SendReminderButton({
  invoiceId,
  invoiceNumber,
  customerEmail,
  paymentStatus,
  variant = 'outline',
}: SendReminderButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendReminder = async () => {
    setError('');
    setSuccess(false);

    startTransition(async () => {
      const result = await sendPaymentReminderEmail(invoiceId);

      if (!result.success) {
        setError(result.error || 'Failed to send reminder');
      } else {
        setSuccess(true);
        // Close dialog after 2 seconds
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 2000);
      }
    });
  };

  // Don't show button if invoice is paid or no customer email
  if (paymentStatus === 'paid' || !customerEmail) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Bell className="h-4 w-4 mr-2" />
          Send Reminder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Payment Reminder</DialogTitle>
          <DialogDescription>
            Send a payment reminder email to the customer for invoice {invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-3 border rounded-lg">
            <div className="flex items-start gap-2">
              <Bell className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Reminder will be sent to:</p>
                <p className="text-sm text-gray-600">{customerEmail}</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              The customer will receive an email reminder about this unpaid invoice,
              including the amount due and a link to view the invoice.
            </p>
          </div>

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">
                Reminder sent successfully!
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

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
            onClick={handleSendReminder}
            disabled={isPending || success}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? 'Sending...' : success ? 'Sent!' : 'Send Reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
