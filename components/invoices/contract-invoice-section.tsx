'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderKanban, ChevronDown, ChevronUp } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Contract {
  id: string;
  contractNumber: string;
  type: string;
  name: string;
  totalValue: string;
  totalInvoiced: string;
  remainingValue: string;
  currency: string;
  status: string;
}

interface ContractInvoiceSectionProps {
  customerId: string | null;
  onApply: (data: {
    contractId: string;
    contractName: string;
    description: string;
    unitPrice: number;
    invoiceAmount: number; // GST-inclusive
  }) => void;
}

export function ContractInvoiceSection({ customerId, onApply }: ContractInvoiceSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [mode, setMode] = useState<'percentage' | 'amount'>('percentage');
  const [percentage, setPercentage] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data: contracts } = useSWR<Contract[]>(
    customerId ? `/api/contracts?customerId=${customerId}&status=active` : null,
    fetcher
  );

  if (!customerId || !contracts || contracts.length === 0) return null;

  // API returns { contract, customerName } objects
  const activeContracts: Contract[] = contracts.map((c: any) => c.contract || c);

  const selectedContract = activeContracts.find((c) => c.id === selectedContractId);

  const fmt = (n: number, currency: string = 'BTN') =>
    `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const getInvoiceAmount = (): number => {
    if (!selectedContract) return 0;
    if (mode === 'percentage' && percentage) {
      return (parseFloat(selectedContract.totalValue) * parseFloat(percentage)) / 100;
    }
    if (mode === 'amount' && amount) {
      return parseFloat(amount);
    }
    return 0;
  };

  const invoiceAmount = getInvoiceAmount();
  const remaining = selectedContract ? parseFloat(selectedContract.remainingValue) : 0;

  const handleApply = () => {
    if (!selectedContract || invoiceAmount <= 0) return;
    if (invoiceAmount > remaining * 1.001) {
      alert(`Amount exceeds remaining contract value (${fmt(remaining, selectedContract.currency)})`);
      return;
    }

    const desc = description ||
      `${selectedContract.name}${mode === 'percentage' ? ` - ${percentage}% billing` : ' - Progress billing'}`;

    onApply({
      contractId: selectedContract.id,
      contractName: selectedContract.name,
      description: desc,
      unitPrice: invoiceAmount, // GST-inclusive, will be reverse-calculated at invoice level
      invoiceAmount,
    });

    // Reset
    setSelectedContractId('');
    setPercentage('');
    setAmount('');
    setDescription('');
    setIsExpanded(false);
  };

  return (
    <div className="border border-purple-200 bg-purple-50/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-purple-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">
            Invoice from Contract
          </span>
          <span className="text-xs text-purple-500">
            ({activeContracts.length} active contract{activeContracts.length !== 1 ? 's' : ''})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-purple-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-purple-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-purple-200">
          {/* Contract Selector */}
          <div className="mt-3">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Contract</Label>
            <select
              value={selectedContractId}
              onChange={(e) => {
                setSelectedContractId(e.target.value);
                setPercentage('');
                setAmount('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">Choose a contract...</option>
              {activeContracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contractNumber} — {c.name} ({c.type === 'project' ? 'Project' : 'AMC'}) · Remaining: {fmt(parseFloat(c.remainingValue), c.currency)}
                </option>
              ))}
            </select>
          </div>

          {selectedContract && (
            <>
              {/* Contract Summary */}
              <div className="bg-white rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Contract Value:</span>
                  <span className="font-medium text-gray-900">{fmt(parseFloat(selectedContract.totalValue), selectedContract.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Already Invoiced:</span>
                  <span className="font-medium">{fmt(parseFloat(selectedContract.totalInvoiced), selectedContract.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-orange-600">
                  <span>Remaining:</span>
                  <span>{fmt(remaining, selectedContract.currency)}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, (parseFloat(selectedContract.totalInvoiced) / parseFloat(selectedContract.totalValue)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('percentage')}
                  className={`flex-1 text-xs py-2 px-3 rounded-md font-medium border transition-all ${
                    mode === 'percentage'
                      ? 'bg-purple-100 border-purple-300 text-purple-800'
                      : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  By Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setMode('amount')}
                  className={`flex-1 text-xs py-2 px-3 rounded-md font-medium border transition-all ${
                    mode === 'amount'
                      ? 'bg-purple-100 border-purple-300 text-purple-800'
                      : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  By Amount
                </button>
              </div>

              {mode === 'percentage' ? (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Percentage of Contract</Label>
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
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                  {percentage && parseFloat(percentage) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      = {fmt(invoiceAmount, selectedContract.currency)} (GST inclusive)
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Amount (GST inclusive)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Line Item Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`${selectedContract.name} - Progress billing`}
                />
              </div>

              {invoiceAmount > remaining * 1.001 && (
                <p className="text-xs text-red-600 font-medium">
                  ⚠ Exceeds remaining contract value by {fmt(invoiceAmount - remaining, selectedContract.currency)}
                </p>
              )}

              <Button
                type="button"
                onClick={handleApply}
                disabled={invoiceAmount <= 0 || invoiceAmount > remaining * 1.001}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                Add to Invoice
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
