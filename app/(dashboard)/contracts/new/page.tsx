'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomerSearch } from '@/components/invoices/customer-search';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { createContract } from '@/lib/contracts/actions';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  percentage: string;
  amount: string;
  dueDate?: Date;
}

interface BillingEntry {
  id: string;
  periodLabel: string;
  periodStart?: Date;
  periodEnd?: Date;
  amount: string;
  dueDate?: Date;
}

export default function NewContractPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [contractType, setContractType] = useState<'project' | 'amc'>('project');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [totalValue, setTotalValue] = useState('');
  const [isGstInclusive, setIsGstInclusive] = useState(true);
  const [contractGstRate, setContractGstRate] = useState('0');
  const [billingFrequency, setBillingFrequency] = useState('quarterly');

  // Milestones (for projects)
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Billing schedule (for AMC)
  const [billingEntries, setBillingEntries] = useState<BillingEntry[]>([]);

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        percentage: '',
        amount: '',
      },
    ]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: any) => {
    setMilestones(
      milestones.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, [field]: value };

        // Auto-calculate amount from percentage
        if (field === 'percentage' && totalValue) {
          const pct = parseFloat(value) || 0;
          updated.amount = ((parseFloat(totalValue) * pct) / 100).toFixed(2);
        }
        // Auto-calculate percentage from amount
        if (field === 'amount' && totalValue) {
          const amt = parseFloat(value) || 0;
          const total = parseFloat(totalValue) || 1;
          updated.percentage = ((amt / total) * 100).toFixed(2);
        }

        return updated;
      })
    );
  };

  const addBillingEntry = () => {
    setBillingEntries([
      ...billingEntries,
      {
        id: crypto.randomUUID(),
        periodLabel: '',
        amount: '',
      },
    ]);
  };

  const removeBillingEntry = (id: string) => {
    setBillingEntries(billingEntries.filter((b) => b.id !== id));
  };

  const updateBillingEntry = (id: string, field: keyof BillingEntry, value: any) => {
    setBillingEntries(
      billingEntries.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const generateAMCSchedule = () => {
    if (!startDate || !endDate || !totalValue) {
      alert('Please set start date, end date, and total value first');
      return;
    }

    const total = parseFloat(totalValue);
    if (!total) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const entries: BillingEntry[] = [];

    let periods: { label: string; start: Date; end: Date }[] = [];

    if (billingFrequency === 'monthly') {
      let current = new Date(start);
      while (current < end) {
        const periodEnd = new Date(current);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(periodEnd.getDate() - 1);
        const actualEnd = periodEnd > end ? end : periodEnd;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        periods.push({
          label: `${monthNames[current.getMonth()]} ${current.getFullYear()}`,
          start: new Date(current),
          end: actualEnd,
        });
        current = new Date(periodEnd);
        current.setDate(current.getDate() + 1);
      }
    } else if (billingFrequency === 'quarterly') {
      let current = new Date(start);
      let qNum = 1;
      while (current < end) {
        const periodEnd = new Date(current);
        periodEnd.setMonth(periodEnd.getMonth() + 3);
        periodEnd.setDate(periodEnd.getDate() - 1);
        const actualEnd = periodEnd > end ? end : periodEnd;
        periods.push({
          label: `Q${qNum} ${current.getFullYear()}`,
          start: new Date(current),
          end: actualEnd,
        });
        current = new Date(periodEnd);
        current.setDate(current.getDate() + 1);
        qNum++;
      }
    } else if (billingFrequency === 'half_yearly') {
      let current = new Date(start);
      let hNum = 1;
      while (current < end) {
        const periodEnd = new Date(current);
        periodEnd.setMonth(periodEnd.getMonth() + 6);
        periodEnd.setDate(periodEnd.getDate() - 1);
        const actualEnd = periodEnd > end ? end : periodEnd;
        periods.push({
          label: `H${hNum} ${current.getFullYear()}`,
          start: new Date(current),
          end: actualEnd,
        });
        current = new Date(periodEnd);
        current.setDate(current.getDate() + 1);
        hNum++;
      }
    } else if (billingFrequency === 'yearly') {
      let current = new Date(start);
      while (current < end) {
        const periodEnd = new Date(current);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        periodEnd.setDate(periodEnd.getDate() - 1);
        const actualEnd = periodEnd > end ? end : periodEnd;
        periods.push({
          label: `Year ${current.getFullYear()}`,
          start: new Date(current),
          end: actualEnd,
        });
        current = new Date(periodEnd);
        current.setDate(current.getDate() + 1);
      }
    }

    const amountPerPeriod = (total / periods.length).toFixed(2);

    periods.forEach((p) => {
      entries.push({
        id: crypto.randomUUID(),
        periodLabel: p.label,
        periodStart: p.start,
        periodEnd: p.end,
        amount: amountPerPeriod,
        dueDate: p.start,
      });
    });

    setBillingEntries(entries);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    if (!totalValue || parseFloat(totalValue) <= 0) {
      alert('Please enter a valid total value');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('customerId', selectedCustomer.id);
    formData.append('type', contractType);
    formData.append('name', (document.getElementById('name') as HTMLInputElement).value);
    // If GST-exclusive, convert to inclusive for storage
    const enteredAmount = parseFloat(totalValue);
    const gstRate = parseFloat(contractGstRate) || 0;
    let storedTotalValue: number;
    if (!isGstInclusive && gstRate > 0) {
      storedTotalValue = enteredAmount + (enteredAmount * gstRate / 100);
    } else {
      storedTotalValue = enteredAmount;
    }
    formData.append('totalValue', storedTotalValue.toFixed(2));
    formData.append('currency', (document.getElementById('currency') as HTMLSelectElement).value);
    formData.append('gstRate', contractGstRate);
    formData.append('isGstInclusive', isGstInclusive ? 'true' : 'false');

    const description = (document.getElementById('description') as HTMLTextAreaElement)?.value;
    if (description) formData.append('description', description);
    if (startDate) formData.append('startDate', startDate.toISOString());
    if (endDate) formData.append('endDate', endDate.toISOString());
    if (contractType === 'amc') formData.append('billingFrequency', billingFrequency);

    const notes = (document.getElementById('notes') as HTMLTextAreaElement)?.value;
    if (notes) formData.append('notes', notes);
    const terms = (document.getElementById('terms') as HTMLTextAreaElement)?.value;
    if (terms) formData.append('terms', terms);

    // Add milestones
    if (milestones.length > 0) {
      formData.append(
        'milestones',
        JSON.stringify(
          milestones
            .filter((m) => m.name && m.amount)
            .map((m) => ({
              name: m.name,
              description: m.description || undefined,
              percentage: m.percentage ? parseFloat(m.percentage) : undefined,
              amount: parseFloat(m.amount),
              dueDate: m.dueDate?.toISOString(),
            }))
        )
      );
    }

    // Add billing schedule
    if (billingEntries.length > 0) {
      formData.append(
        'billingSchedule',
        JSON.stringify(
          billingEntries
            .filter((b) => b.amount && b.periodStart && b.periodEnd)
            .map((b) => ({
              periodLabel: b.periodLabel || undefined,
              periodStart: b.periodStart!.toISOString(),
              periodEnd: b.periodEnd!.toISOString(),
              amount: parseFloat(b.amount),
              dueDate: b.dueDate?.toISOString(),
            }))
        )
      );
    }

    const result = await createContract({}, formData);

    setIsSubmitting(false);

    if ('success' in result && result.contractId) {
      router.push(`/contracts/${result.contractId}`);
    } else if ('error' in result) {
      setError(result.error || 'Failed to create contract');
    }
  };

  // Calculate milestone totals
  const milestoneTotalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const milestoneTotalPercent = milestones.reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0);
  const billingTotalAmount = billingEntries.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-8">
        <Link
          href="/contracts"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Contracts
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Create New Contract</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        {/* Contract Type Toggle */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Contract Type</h2>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setContractType('project')}
              className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
                contractType === 'project'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900">Project</h3>
              <p className="text-sm text-gray-500 mt-1">
                One-time project with milestone or progress-based billing
              </p>
            </button>
            <button
              type="button"
              onClick={() => setContractType('amc')}
              className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
                contractType === 'amc'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900">AMC</h3>
              <p className="text-sm text-gray-500 mt-1">
                Annual maintenance contract with periodic billing schedule
              </p>
            </button>
          </div>
        </div>

        {/* Basic Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Contract Details</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <CustomerSearch
                  onSelect={setSelectedCustomer}
                  selectedCustomer={selectedCustomer}
                />
                {selectedCustomer && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Customer
                      </Label>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-sm text-gray-900 font-semibold">{selectedCustomer.name}</p>
                    {selectedCustomer.email && (
                      <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                    )}
                    {selectedCustomer.phone && (
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                  Contract Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder={contractType === 'project' ? 'e.g., ERP System Development' : 'e.g., Annual Server Maintenance 2026'}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </Label>
                <Textarea id="description" placeholder="Brief description of the contract" rows={3} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalValue" className="text-sm font-medium text-gray-700 mb-2 block">
                    Contract Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="totalValue"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency" className="text-sm font-medium text-gray-700 mb-2 block">
                    Currency
                  </Label>
                  <select
                    id="currency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    defaultValue="BTN"
                  >
                    <option value="BTN">BTN</option>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              {/* GST Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">GST Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={contractGstRate}
                    onChange={(e) => setContractGstRate(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGstInclusive}
                      onChange={(e) => setIsGstInclusive(e.target.checked)}
                      className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Amount is GST inclusive</span>
                  </label>
                </div>
              </div>

              {/* Tax Breakdown */}
              {totalValue && parseFloat(totalValue) > 0 && parseFloat(contractGstRate) > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  {(() => {
                    const enteredAmount = parseFloat(totalValue);
                    const gstRate = parseFloat(contractGstRate);
                    let baseAmount: number;
                    let gstAmount: number;
                    let totalWithGst: number;

                    if (isGstInclusive) {
                      // Reverse-calculate: entered amount includes GST
                      baseAmount = enteredAmount / (1 + gstRate / 100);
                      gstAmount = enteredAmount - baseAmount;
                      totalWithGst = enteredAmount;
                    } else {
                      // Entered amount is before GST
                      baseAmount = enteredAmount;
                      gstAmount = enteredAmount * (gstRate / 100);
                      totalWithGst = enteredAmount + gstAmount;
                    }

                    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Project/Service Value (excl. GST)</span>
                          <span className="font-medium text-gray-900">{fmt(baseAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">GST ({gstRate}%)</span>
                          <span className="font-medium text-gray-900">{fmt(gstAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-gray-300 pt-2">
                          <span>Total Contract Value (incl. GST)</span>
                          <span className="text-orange-600">{fmt(totalWithGst)}</span>
                        </div>
                        {!isGstInclusive && (
                          <p className="text-xs text-gray-400 mt-1">
                            Contract will be stored as {fmt(totalWithGst)} (GST inclusive)
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Start Date</Label>
                  <DatePicker
                    id="startDate"
                    name="startDate"
                    date={startDate}
                    onDateChange={setStartDate}
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">End Date</Label>
                  <DatePicker
                    id="endDate"
                    name="endDate"
                    date={endDate}
                    onDateChange={setEndDate}
                    placeholder="Select end date"
                  />
                </div>
              </div>

              {contractType === 'amc' && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Billing Frequency
                  </Label>
                  <select
                    value={billingFrequency}
                    onChange={(e) => setBillingFrequency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half Yearly</option>
                    <option value="yearly">Yearly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Milestones (for Projects) */}
        {contractType === 'project' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Milestones</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Optional — you can also invoice ad-hoc percentages later
                </p>
              </div>
              <Button type="button" onClick={addMilestone} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>

            {milestones.length > 0 && (
              <div className="space-y-4">
                {milestones.map((m, index) => (
                  <div key={m.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-500">Milestone {index + 1}</span>
                      <Button
                        type="button"
                        onClick={() => removeMilestone(m.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <Input
                          placeholder="Milestone name"
                          value={m.name}
                          onChange={(e) => updateMilestone(m.id, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="% of total"
                          value={m.percentage}
                          onChange={(e) => updateMilestone(m.id, 'percentage', e.target.value)}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount"
                          value={m.amount}
                          onChange={(e) => updateMilestone(m.id, 'amount', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Milestone Totals */}
                <div className="flex justify-end gap-6 text-sm pt-2 border-t">
                  <span className="text-gray-500">
                    Total: <strong>{milestoneTotalPercent.toFixed(1)}%</strong> ({milestoneTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                  </span>
                  {totalValue && (
                    <span className={milestoneTotalAmount > parseFloat(totalValue) ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {milestoneTotalAmount > parseFloat(totalValue)
                        ? `Exceeds by ${(milestoneTotalAmount - parseFloat(totalValue)).toFixed(2)}`
                        : `Remaining: ${(parseFloat(totalValue) - milestoneTotalAmount).toFixed(2)}`}
                    </span>
                  )}
                </div>
              </div>
            )}

            {milestones.length === 0 && (
              <div className="text-center py-8 text-gray-400 border border-dashed border-gray-300 rounded-lg">
                <p>No milestones defined. You can add them now or invoice ad-hoc later.</p>
              </div>
            )}
          </div>
        )}

        {/* Billing Schedule (for AMC) */}
        {contractType === 'amc' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Billing Schedule</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Define billing periods or auto-generate from frequency
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={generateAMCSchedule} variant="outline" size="sm">
                  Auto-Generate
                </Button>
                <Button type="button" onClick={addBillingEntry} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Period
                </Button>
              </div>
            </div>

            {billingEntries.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-500 uppercase px-1">
                  <div className="col-span-2">Period</div>
                  <div className="col-span-3">Start</div>
                  <div className="col-span-3">End</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-1">Due</div>
                  <div className="col-span-1"></div>
                </div>
                {billingEntries.map((b) => (
                  <div key={b.id} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-2">
                      <Input
                        placeholder="Q1 2026"
                        value={b.periodLabel}
                        onChange={(e) => updateBillingEntry(b.id, 'periodLabel', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <DatePicker
                        date={b.periodStart}
                        onDateChange={(date) => updateBillingEntry(b.id, 'periodStart', date)}
                        placeholder="Start"
                      />
                    </div>
                    <div className="col-span-3">
                      <DatePicker
                        date={b.periodEnd}
                        onDateChange={(date) => updateBillingEntry(b.id, 'periodEnd', date)}
                        placeholder="End"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={b.amount}
                        onChange={(e) => updateBillingEntry(b.id, 'amount', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <DatePicker
                        date={b.dueDate}
                        onDateChange={(date) => updateBillingEntry(b.id, 'dueDate', date)}
                        placeholder="Due"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <Button
                        type="button"
                        onClick={() => removeBillingEntry(b.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end text-sm pt-2 border-t">
                  <span className="text-gray-500">
                    Total: <strong>{billingTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </span>
                  {totalValue && (
                    <span className={`ml-4 ${billingTotalAmount > parseFloat(totalValue) ? 'text-red-600' : 'text-green-600'}`}>
                      {billingTotalAmount > parseFloat(totalValue)
                        ? `Exceeds by ${(billingTotalAmount - parseFloat(totalValue)).toFixed(2)}`
                        : `Remaining: ${(parseFloat(totalValue) - billingTotalAmount).toFixed(2)}`}
                    </span>
                  )}
                </div>
              </div>
            )}

            {billingEntries.length === 0 && (
              <div className="text-center py-8 text-gray-400 border border-dashed border-gray-300 rounded-lg">
                <p>No billing schedule. Click "Auto-Generate" to create from frequency, or add manually.</p>
              </div>
            )}
          </div>
        )}

        {/* Notes & Terms */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Notes & Terms</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
                Internal Notes
              </Label>
              <Textarea id="notes" placeholder="Private notes about this contract" rows={2} />
            </div>
            <div>
              <Label htmlFor="terms" className="text-sm font-medium text-gray-700 mb-2 block">
                Terms & Conditions
              </Label>
              <Textarea id="terms" placeholder="Contract terms and conditions" rows={3} />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-4 pb-8">
          <Button
            type="submit"
            disabled={isSubmitting || !selectedCustomer}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? 'Creating...' : 'Create Contract'}
          </Button>
          <Link href="/contracts">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </section>
  );
}
