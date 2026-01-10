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
import { Send, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { lockInvoice } from '@/lib/invoices/actions';
import { sendInvoiceEmail } from '@/lib/email/actions';

interface SendInvoiceDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  customerEmail?: string | null;
}

export function SendInvoiceDialog({
  invoiceId,
  invoiceNumber,
  customerEmail,
}: SendInvoiceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [sendEmail, setSendEmail] = useState(!!customerEmail);
  const [emailSent, setEmailSent] = useState(false);

  const handleSend = async () => {
    setError('');
    setEmailSent(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', invoiceId.toString());

      // First, lock the invoice
      const result = await lockInvoice({}, formData);

      if ('error' in result && result.error) {
        setError(result.error);
        return;
      }

      // If email is enabled and customer has email, send it
      if (sendEmail && customerEmail) {
        const emailResult = await sendInvoiceEmail(invoiceId);

        if (!emailResult.success) {
          setError(`Invoice sent but email failed: ${emailResult.error}`);
        } else {
          setEmailSent(true);
        }
      }

      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Invoice</DialogTitle>
          <DialogDescription>
            Send invoice {invoiceNumber} to the customer. This will lock the
            invoice and prevent further edits.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-600">
            Once sent, this invoice cannot be edited. You can track payments and
            send reminders after sending.
          </p>

          {/* Email delivery option */}
          {customerEmail ? (
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <input
                  type="checkbox"
                  id="send-email"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="send-email"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Send invoice via email
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Email will be sent to: {customerEmail}
                  </p>
                </div>
              </div>

              {emailSent && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-800">
                    Invoice email sent successfully!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>No email address:</strong> This customer doesn't have
                  an email address. The invoice will be marked as sent only.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  You can add an email address to the customer profile to enable
                  email delivery.
                </p>
              </div>
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
            onClick={handleSend}
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isPending ? 'Sending...' : 'Send Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
