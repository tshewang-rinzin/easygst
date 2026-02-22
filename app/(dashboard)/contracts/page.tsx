'use client';

import { useState } from 'react';
import { FeatureGate } from '@/components/feature-gate';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FolderKanban, ArrowRight } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      type === 'project' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
    }`}>
      {type === 'project' ? 'Project' : 'AMC'}
    </span>
  );
}

export default function ContractsPage() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type') || '';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (typeFilter) queryParams.set('type', typeFilter);
  if (statusFilter) queryParams.set('status', statusFilter);

  const { data: contracts, isLoading } = useSWR(
    `/api/contracts?${queryParams.toString()}`,
    fetcher
  );

  const formatCurrency = (amount: string, currency: string = 'BTN') => {
    return `${currency} ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getProgressPercent = (totalInvoiced: string, totalValue: string) => {
    const invoiced = parseFloat(totalInvoiced);
    const total = parseFloat(totalValue);
    if (total === 0) return 0;
    return Math.min(100, (invoiced / total) * 100);
  };

  return (
    <FeatureGate feature="contracts">
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contracts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage projects and annual maintenance contracts
          </p>
        </div>
        <Link href="/contracts/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contracts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Contract List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading contracts...</div>
      ) : !contracts || contracts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
          <FolderKanban className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first project or AMC contract to start billing.
          </p>
          <Link href="/contracts/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Contract
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((item: any) => {
            const c = item.contract;
            const progress = getProgressPercent(c.totalInvoiced, c.totalValue);

            return (
              <Link
                key={c.id}
                href={`/contracts/${c.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-orange-300 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-500">{c.contractNumber}</span>
                      <TypeBadge type={c.type} />
                      <StatusBadge status={c.status} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                    <p className="text-sm text-gray-500">{item.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(c.totalValue, c.currency)}
                    </p>
                    <p className="text-xs text-gray-500">Contract Value</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Invoiced: {formatCurrency(c.totalInvoiced, c.currency)}</span>
                    <span>Remaining: {formatCurrency(c.remainingValue, c.currency)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{progress.toFixed(0)}% invoiced</p>
                </div>

                {c.startDate && (
                  <div className="flex gap-4 mt-3 text-xs text-gray-400">
                    <span>Start: {new Date(c.startDate).toLocaleDateString()}</span>
                    {c.endDate && <span>End: {new Date(c.endDate).toLocaleDateString()}</span>}
                    {c.billingFrequency && (
                      <span>Billing: {c.billingFrequency.replace('_', ' ')}</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </section>
    </FeatureGate>
  );
}
