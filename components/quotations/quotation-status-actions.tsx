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
import { Send, Mail, CheckCircle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { updateQuotationStatus } from '@/lib/quotations/actions';
import { sendQuotationEmail } from '@/lib/email/actions';
import { FeatureGate } from '@/components/feature-gate';

interface Props {
  quotationId: string;
  currentStatus: string;
  quotationNumber?: string;
  customerEmail?: string | null;
}

export function QuotationStatusActions({ quotationId, currentStatus, quotationNumber, customerEmail }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [sendEmail, setSendEmail] = useState(!!customerEmail);
  const [isLoading, setIsLoading] = useState('');

  const handleSend = async () => {
    setError('');

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', quotationId);
      formData.append('status', 'sent');

      const result = await updateQuotationStatus({}, formData);

      if ('error' in result && result.error) {
        setError(result.error);
        return;
      }

      // Send email if enabled
      if (sendEmail && customerEmail) {
        const emailResult = await sendQuotationEmail(quotationId);

        if (!emailResult.success) {
          setError(`Quotation marked as sent but email failed: ${emailResult.error}`);
        }
      }

      setOpen(false);
      router.refresh();
    });
  };

  const handleStatusChange = async (newStatus: 'accepted' | 'rejected') => {
    setIsLoading(newStatus);
    const formData = new FormData();
    formData.append('id', quotationId);
    formData.append('status', newStatus);

    const result = await updateQuotationStatus({}, formData);
    setIsLoading('');

    if ('error' in result && result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  };

  if (currentStatus === 'draft') {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quotation</DialogTitle>
            <DialogDescription>
              Send quotation {quotationNumber || ''} to customer. This will mark it as sent.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <FeatureGate feature="email_invoices" fallback={null}>
            {customerEmail ? (
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
                    Send quotation via email
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Email will be sent to: {customerEmail}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800">
                    <strong>No email address:</strong> This customer doesn&apos;t have
                    an email address. The quotation will be marked as sent only.
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    You can add an email address to the customer profile to enable
                    email delivery.
                  </p>
                </div>
              </div>
            )}
            </FeatureGate>
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
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isPending ? 'Sending...' : 'Send Quotation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (currentStatus === 'sent') {
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => handleStatusChange('accepted')}
          disabled={!!isLoading}
          className="bg-green-500 hover:bg-green-600"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {isLoading === 'accepted' ? 'Updating...' : 'Mark Accepted'}
        </Button>
        <Button
          onClick={() => handleStatusChange('rejected')}
          disabled={!!isLoading}
          variant="destructive"
        >
          <XCircle className="h-4 w-4 mr-2" />
          {isLoading === 'rejected' ? 'Updating...' : 'Mark Rejected'}
        </Button>
      </div>
    );
  }

  return null;
}
