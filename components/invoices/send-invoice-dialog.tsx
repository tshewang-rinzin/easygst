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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Mail, CheckCircle2, AlertCircle, MessageSquare, Phone } from 'lucide-react';
import { lockInvoice } from '@/lib/invoices/actions';
import { sendInvoiceEmail } from '@/lib/email/actions';

interface SendInvoiceDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
}

export function SendInvoiceDialog({
  invoiceId,
  invoiceNumber,
  customerEmail,
  customerPhone,
}: SendInvoiceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [sendEmail, setSendEmail] = useState(!!customerEmail);
  const [sendSms, setSendSms] = useState(false);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(customerPhone || '');
  const [emailSent, setEmailSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);

  const handleSend = async () => {
    setError('');
    setEmailSent(false);
    setSmsSent(false);
    setWhatsappSent(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', invoiceId.toString());

      // First, lock the invoice
      const result = await lockInvoice({}, formData);

      if ('error' in result && result.error) {
        setError(result.error);
        return;
      }

      const errors: string[] = [];

      // Send email if enabled
      if (sendEmail && customerEmail) {
        const emailResult = await sendInvoiceEmail(invoiceId);
        if (!emailResult.success) {
          errors.push(`Email: ${emailResult.error}`);
        } else {
          setEmailSent(true);
        }
      }

      // Send SMS if enabled
      if (sendSms && phoneNumber) {
        try {
          const res = await fetch(`/api/invoices/${invoiceId}/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneNumber }),
          });
          const data = await res.json();
          if (!res.ok) {
            errors.push(`SMS: ${data.error}`);
          } else {
            setSmsSent(true);
          }
        } catch {
          errors.push('SMS: Failed to send');
        }
      }

      // Send WhatsApp if enabled
      if (sendWhatsapp && phoneNumber) {
        try {
          const res = await fetch(`/api/invoices/${invoiceId}/send-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneNumber }),
          });
          const data = await res.json();
          if (!res.ok) {
            errors.push(`WhatsApp: ${data.error}`);
          } else {
            setWhatsappSent(true);
          }
        } catch {
          errors.push('WhatsApp: Failed to send');
        }
      }

      if (errors.length > 0) {
        setError(`Invoice sent but some deliveries failed:\n${errors.join('\n')}`);
      }

      if (errors.length === 0) {
        setOpen(false);
      }
      router.refresh();
    });
  };

  const needsPhone = sendSms || sendWhatsapp;

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
            Once sent, this invoice cannot be edited. Choose how to deliver it:
          </p>

          {/* Email delivery option */}
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
                  Send via Email
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  To: {customerEmail}
                </p>
              </div>
              {emailSent && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-xs text-yellow-800">
                No email address on file for this customer.
              </p>
            </div>
          )}

          {/* SMS delivery option */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              id="send-sms"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label
                htmlFor="send-sms"
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Send via SMS
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Send invoice details as text message
              </p>
            </div>
            {smsSent && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          </div>

          {/* WhatsApp delivery option */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg">
            <input
              type="checkbox"
              id="send-whatsapp"
              checked={sendWhatsapp}
              onChange={(e) => setSendWhatsapp(e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label
                htmlFor="send-whatsapp"
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Send via WhatsApp
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Send invoice with PDF attachment via WhatsApp
              </p>
            </div>
            {whatsappSent && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          </div>

          {/* Phone number input (shown when SMS or WhatsApp selected) */}
          {needsPhone && (
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number (E.164 format)</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="+97517123456"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              {!phoneNumber && (
                <p className="text-xs text-red-500">
                  Phone number is required for SMS/WhatsApp delivery.
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
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
            disabled={isPending || (needsPhone && !phoneNumber)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isPending ? 'Sending...' : 'Send Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
