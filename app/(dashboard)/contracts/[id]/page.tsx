'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  ExternalLink,
  Calendar,
  DollarSign,
  Percent,
  Trash2,
  Pencil,
} from 'lucide-react';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    invoiced: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Dialog for creating invoice from contract
function CreateInvoiceDialog({
  contract,
  milestones,
  billingEntries,
  onClose,
  onSuccess,
}: {
  contract: any;
  milestones: any[];
  billingEntries: any[];
  onClose: () => void;
  onSuccess: (invoiceId: string) => void;
}) {
  const [mode, setMode] = useState<'milestone' | 'schedule' | 'percentage' | 'amount'>('percentage');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [percentage, setPercentage] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [taxRate, setTaxRate] = useState(contract.contract.gstRate || '0');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pendingMilestones = milestones.filter((m: any) => m.status === 'pending');
  const pendingSchedule = billingEntries.filter((b: any) => b.status === 'pending');

  // Auto-calculate amount from percentage
  const calculatedAmount = percentage
    ? ((parseFloat(contract.contract.totalValue) * parseFloat(percentage)) / 100).toFixed(2)
    : '';

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    const body: any = {
      invoiceDate: invoiceDate.toISOString(),
      dueDate: dueDate?.toISOString(),
      taxRate: parseFloat(taxRate) || 0,
    };

    if (mode === 'milestone') {
      if (!selectedMilestoneId) { setError('Select a milestone'); setIsSubmitting(false); return; }
      body.milestoneId = selectedMilestoneId;
    } else if (mode === 'schedule') {
      if (!selectedScheduleId) { setError('Select a billing period'); setIsSubmitting(false); return; }
      body.billingScheduleId = selectedScheduleId;
    } else if (mode === 'percentage') {
      if (!percentage || parseFloat(percentage) <= 0) { setError('Enter a valid percentage'); setIsSubmitting(false); return; }
      body.percentage = parseFloat(percentage);
      if (description) body.description = description;
    } else if (mode === 'amount') {
      if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); setIsSubmitting(false); return; }
      body.amount = parseFloat(amount);
      if (description) body.description = description;
    }

    try {
      const res = await fetch(`/api/contracts/${contract.contract.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (result.error) {
        setError(result.error);
      } else if (result.invoiceId) {
        onSuccess(result.invoiceId);
      }
    } catch (err) {
      setError('Failed to create invoice');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Create Invoice from Contract</h2>
          <p className="text-sm text-gray-500 mb-6">
            Remaining: {contract.contract.currency} {parseFloat(contract.contract.remainingValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>

          {/* Mode tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
            {pendingMilestones.length > 0 && (
              <button
                type="button"
                onClick={() => setMode('milestone')}
                className={`flex-1 text-xs py-2 px-3 rounded-md font-medium transition-all ${
                  mode === 'milestone' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                Milestone
              </button>
            )}
            {pendingSchedule.length > 0 && (
              <button
                type="button"
                onClick={() => setMode('schedule')}
                className={`flex-1 text-xs py-2 px-3 rounded-md font-medium transition-all ${
                  mode === 'schedule' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                Schedule
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode('percentage')}
              className={`flex-1 text-xs py-2 px-3 rounded-md font-medium transition-all ${
                mode === 'percentage' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              By %
            </button>
            <button
              type="button"
              onClick={() => setMode('amount')}
              className={`flex-1 text-xs py-2 px-3 rounded-md font-medium transition-all ${
                mode === 'amount' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              By Amount
            </button>
          </div>

          <div className="space-y-4">
            {mode === 'milestone' && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Milestone</Label>
                <select
                  value={selectedMilestoneId}
                  onChange={(e) => setSelectedMilestoneId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="">Choose milestone...</option>
                  {pendingMilestones.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {contract.contract.currency} {parseFloat(m.amount).toLocaleString()}
                      {m.percentage ? ` (${parseFloat(m.percentage)}%)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === 'schedule' && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Billing Period</Label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="">Choose period...</option>
                  {pendingSchedule.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.periodLabel || 'Period'} — {contract.contract.currency} {parseFloat(b.amount).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === 'percentage' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Percentage of Contract</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      placeholder="e.g., 20"
                      className="flex-1"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                  {calculatedAmount && (
                    <p className="text-sm text-gray-500 mt-1">
                      Amount: {contract.contract.currency} {parseFloat(calculatedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Description (optional)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Phase 1 completion"
                  />
                </div>
              </div>
            )}

            {mode === 'amount' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Invoice Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Description (optional)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Progress billing - Feb 2026"
                  />
                </div>
              </div>
            )}

            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Invoice Date</Label>
                <DatePicker
                  date={invoiceDate}
                  onDateChange={(d) => setInvoiceDate(d || new Date())}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</Label>
                <DatePicker
                  date={dueDate}
                  onDateChange={setDueDate}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">GST Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Invoice Amount Preview with GST Breakdown (GST-inclusive) */}
            {(() => {
              let inclusiveAmount = 0;
              if (mode === 'milestone' && selectedMilestoneId) {
                const m = pendingMilestones.find((m: any) => m.id === selectedMilestoneId);
                if (m) inclusiveAmount = parseFloat(m.amount);
              } else if (mode === 'schedule' && selectedScheduleId) {
                const b = pendingSchedule.find((b: any) => b.id === selectedScheduleId);
                if (b) inclusiveAmount = parseFloat(b.amount);
              } else if (mode === 'percentage' && percentage) {
                inclusiveAmount = (parseFloat(contract.contract.totalValue) * parseFloat(percentage)) / 100;
              } else if (mode === 'amount' && amount) {
                inclusiveAmount = parseFloat(amount);
              }

              if (inclusiveAmount > 0) {
                const gstRate = parseFloat(taxRate) || 0;
                // Reverse-calculate: inclusive amount = subtotal + GST
                // subtotal = inclusiveAmount / (1 + gstRate/100)
                const subtotal = gstRate > 0 ? inclusiveAmount / (1 + gstRate / 100) : inclusiveAmount;
                const gstAmount = inclusiveAmount - subtotal;
                const curr = contract.contract.currency;
                const fmt = (n: number) => `${curr} ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                return (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal (excl. GST)</span>
                      <span className="font-medium text-gray-900">{fmt(subtotal)}</span>
                    </div>
                    {gstRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">GST ({gstRate}%)</span>
                        <span className="font-medium text-gray-900">{fmt(gstAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-2">
                      <span>Total (incl. GST)</span>
                      <span className="text-orange-600">{fmt(inclusiveAmount)}</span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const { data: contract, isLoading, error } = useSWR(
    `/api/contracts/${contractId}`,
    fetcher
  );

  if (isLoading) return <div className="p-8 text-gray-500">Loading contract...</div>;
  if (error || !contract || contract.error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Contract not found</p>
        <Link href="/contracts" className="text-sm text-orange-500 hover:underline mt-2 block">
          Back to Contracts
        </Link>
      </div>
    );
  }

  const c = contract.contract;
  const progress = parseFloat(c.totalValue) > 0
    ? (parseFloat(c.totalInvoiced) / parseFloat(c.totalValue)) * 100
    : 0;

  const formatCurrency = (amount: string) => {
    return `${c.currency} ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const handleComplete = async () => {
    if (!confirm('Mark this contract as completed?')) return;
    setActionLoading('complete');
    await fetch(`/api/contracts/${contractId}`, { method: 'PATCH', body: JSON.stringify({ action: 'complete' }) });
    mutate(`/api/contracts/${contractId}`);
    setActionLoading('');
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this contract? This cannot be undone.')) return;
    setActionLoading('cancel');
    await fetch(`/api/contracts/${contractId}`, { method: 'PATCH', body: JSON.stringify({ action: 'cancel' }) });
    mutate(`/api/contracts/${contractId}`);
    setActionLoading('');
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this contract? This cannot be undone.')) return;
    setActionLoading('delete');
    const res = await fetch(`/api/contracts/${contractId}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.error) {
      alert(result.error);
      setActionLoading('');
    } else {
      router.push('/contracts');
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/contracts"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Contracts
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-gray-500">{c.contractNumber}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                c.type === 'project' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {c.type === 'project' ? 'Project' : 'AMC'}
              </span>
              <StatusBadge status={c.status} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">{c.name}</h1>
            <p className="text-gray-500 mt-1">Customer: {contract.customerName}</p>
            {c.description && <p className="text-sm text-gray-500 mt-2">{c.description}</p>}
          </div>

          <div className="flex gap-2">
            {(c.status === 'draft' || c.status === 'active') && (
              <Link href={`/contracts/${contractId}/edit`}>
                <Button variant="outline">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            {c.status === 'active' && (
              <>
                <Button
                  onClick={() => setShowInvoiceDialog(true)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
                <Button
                  onClick={handleComplete}
                  variant="outline"
                  disabled={!!actionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  disabled={!!actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
            {(c.status === 'draft' || c.status === 'cancelled') && (
              <Button
                onClick={handleDelete}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={!!actionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Contract Value</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(c.totalValue)}</p>
            {parseFloat(c.gstRate || '0') > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                <span>Excl. GST: {formatCurrency((parseFloat(c.totalValue) / (1 + parseFloat(c.gstRate) / 100)).toFixed(2))}</span>
                <span className="mx-1">·</span>
                <span>GST {parseFloat(c.gstRate)}%: {formatCurrency((parseFloat(c.totalValue) - parseFloat(c.totalValue) / (1 + parseFloat(c.gstRate) / 100)).toFixed(2))}</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Invoiced</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(c.totalInvoiced)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Paid</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(c.totalPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Remaining</p>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(c.remainingValue)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-orange-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{progress.toFixed(1)}% invoiced</p>
        </div>

        {/* Dates */}
        {(c.startDate || c.endDate || c.billingFrequency) && (
          <div className="flex gap-6 mt-4 text-sm text-gray-500">
            {c.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Start: {new Date(c.startDate).toLocaleDateString()}
              </span>
            )}
            {c.endDate && (
              <span>End: {new Date(c.endDate).toLocaleDateString()}</span>
            )}
            {c.billingFrequency && (
              <span>Billing: {c.billingFrequency.replace('_', ' ')}</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones (for projects) */}
        {contract.milestones && contract.milestones.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Milestones</h2>
            <div className="space-y-3">
              {contract.milestones.map((m: any) => (
                <div
                  key={m.id}
                  className="flex justify-between items-center p-3 border border-gray-100 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{m.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(m.amount)}
                      {m.percentage && ` (${parseFloat(m.percentage)}%)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    {m.invoiceId && (
                      <Link href={`/invoices/${m.invoiceId}`}>
                        <ExternalLink className="h-4 w-4 text-gray-400 hover:text-orange-500" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Billing Schedule (for AMC) */}
        {contract.billingEntries && contract.billingEntries.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Billing Schedule</h2>
            <div className="space-y-3">
              {contract.billingEntries.map((b: any) => (
                <div
                  key={b.id}
                  className="flex justify-between items-center p-3 border border-gray-100 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{b.periodLabel || 'Period'}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(b.amount)}
                      {b.dueDate && ` · Due: ${new Date(b.dueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={b.status} />
                    {b.invoiceId && (
                      <Link href={`/invoices/${b.invoiceId}`}>
                        <ExternalLink className="h-4 w-4 text-gray-400 hover:text-orange-500" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Invoices */}
        <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${
          (!contract.milestones?.length && !contract.billingEntries?.length) ? 'lg:col-span-2' : ''
        }`}>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Invoices</h2>
          {contract.linkedInvoices && contract.linkedInvoices.length > 0 ? (
            <div className="space-y-3">
              {contract.linkedInvoices.map((inv: any) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:border-orange-200 transition-all"
                >
                  <div>
                    <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(inv.invoiceDate).toLocaleDateString()} · {formatCurrency(inv.totalAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <InvoiceStatusBadge status={inv.status} />
                    <span className="text-sm text-gray-500">
                      {inv.paymentStatus === 'paid'
                        ? 'Paid'
                        : `Due: ${formatCurrency(inv.amountDue)}`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No invoices created yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {(c.notes || c.terms) && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {c.notes && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Internal Notes</h3>
              <p className="text-sm text-gray-600">{c.notes}</p>
            </div>
          )}
          {c.terms && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Terms & Conditions</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.terms}</p>
            </div>
          )}
        </div>
      )}

      {/* Invoice Dialog */}
      {showInvoiceDialog && (
        <CreateInvoiceDialog
          contract={contract}
          milestones={contract.milestones || []}
          billingEntries={contract.billingEntries || []}
          onClose={() => setShowInvoiceDialog(false)}
          onSuccess={(invoiceId) => {
            setShowInvoiceDialog(false);
            router.push(`/invoices/${invoiceId}`);
          }}
        />
      )}
    </section>
  );
}
