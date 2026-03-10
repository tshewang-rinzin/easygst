'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pause, Play, XCircle, FileText, Loader2 } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import {
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  generateSubscriptionInvoice,
} from '@/lib/subscriptions/actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const cycleLabels: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  half_yearly: 'Half Yearly',
  yearly: 'Yearly',
};

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState('');

  const { data, isLoading, error } = useSWR(`/api/subscriptions/${id}`, fetcher);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      let result: any;
      switch (action) {
        case 'pause':
          result = await pauseSubscription(id);
          break;
        case 'resume':
          result = await resumeSubscription(id);
          break;
        case 'cancel':
          if (!confirm('Are you sure you want to cancel this subscription?')) {
            setLoading('');
            return;
          }
          result = await cancelSubscription(id);
          break;
        case 'generate':
          result = await generateSubscriptionInvoice(id);
          break;
      }
      mutate(`/api/subscriptions/${id}`);
    } catch (err) {
      console.error('Action failed:', err);
    }
    setLoading('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string, currency: string = 'BTN') => {
    return `${currency} ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-gray-500">
        Subscription not found.{' '}
        <Link href="/subscriptions" className="text-orange-600 hover:underline">Go back</Link>
      </div>
    );
  }

  const sub = data.subscription;
  const status = sub.status;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/subscriptions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{sub.subscriptionNumber}</h1>
            <StatusBadge status={status} />
          </div>
          <p className="text-gray-500 text-sm mt-1">{data.customerName}</p>
        </div>
        <div className="flex gap-2">
          {status === 'active' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('pause')}
                disabled={!!loading}
              >
                {loading === 'pause' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4 mr-1" />}
                Pause
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('generate')}
                disabled={!!loading}
              >
                {loading === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                Generate Invoice
              </Button>
            </>
          )}
          {status === 'paused' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('resume')}
              disabled={!!loading}
            >
              {loading === 'resume' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
              Resume
            </Button>
          )}
          {(status === 'active' || status === 'paused') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction('cancel')}
              disabled={!!loading}
            >
              {loading === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Package</span>
              <span className="font-medium">{data.productName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Billing Cycle</span>
              <span className="font-medium">{cycleLabels[sub.billingCycle] || sub.billingCycle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price per Cycle</span>
              <span className="font-medium">{formatCurrency(sub.price, sub.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Auto-Invoice</span>
              <span className="font-medium">{sub.autoInvoice ? 'Yes' : 'No'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Start Date</span>
              <span className="font-medium">{formatDate(sub.startDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Next Billing Date</span>
              <span className="font-medium">{formatDate(sub.nextBillingDate)}</span>
            </div>
            {sub.expiryDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expiry Date</span>
                <span className="font-medium">{formatDate(sub.expiryDate)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Created</span>
              <span className="font-medium">{formatDate(sub.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {sub.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{sub.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {!data.linkedInvoices || data.linkedInvoices.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No invoices generated yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.linkedInvoices.map((inv: any) => (
                    <tr key={inv.link.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">
                        <Link
                          href={`/sales/invoices/${inv.invoiceId}`}
                          className="text-orange-600 hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {formatDate(inv.link.billingPeriodStart)} — {formatDate(inv.link.billingPeriodEnd)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {inv.invoiceDate ? formatDate(inv.invoiceDate) : '—'}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium">
                        {inv.totalAmount ? formatCurrency(inv.totalAmount) : '—'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <StatusBadge status={inv.status || 'draft'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
