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
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendInvoiceEmail } from '@/lib/email/actions';

interface EmailInvoiceButtonProps {
  invoiceId: number;
  invoiceNumber: string;
  customerEmail?: string | null;
  variant?: 'default' | 'outline' | 'ghost';
}

export function EmailInvoiceButton({
  invoiceId,
  invoiceNumber,
  customerEmail,
  variant = 'outline',
}: EmailInvoiceButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendEmail = async () => {
    setError('');
    setSuccess(false);

    startTransition(async () => {
      const result = await sendInvoiceEmail(invoiceId);

      if (!result.success) {
        setError(result.error || 'Failed to send email');
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

  if (!customerEmail) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Mail className="h-4 w-4 mr-2" />
          Email Invoice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Invoice</DialogTitle>
          <DialogDescription>
            Send invoice {invoiceNumber} to the customer via email
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-3 border rounded-lg">
            <div className="flex items-start gap-2">
              <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email will be sent to:</p>
                <p className="text-sm text-gray-600">{customerEmail}</p>
              </div>
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">
                Invoice email sent successfully!
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
            onClick={handleSendEmail}
            disabled={isPending || success}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isPending ? 'Sending...' : success ? 'Sent!' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
