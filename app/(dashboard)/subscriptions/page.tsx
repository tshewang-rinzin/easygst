'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function BillingCycleBadge({ cycle }: { cycle: string }) {
  const labels: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    half_yearly: 'Half Yearly',
    yearly: 'Yearly',
  };
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      {labels[cycle] || cycle}
    </span>
  );
}

export default function SubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (statusFilter) queryParams.set('status', statusFilter);

  const { data: subscriptions, isLoading } = useSWR(
    `/api/subscriptions?${queryParams.toString()}`,
    fetcher
  );

  const formatCurrency = (amount: string, currency: string = 'BTN') => {
    return `${currency} ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage recurring billing subscriptions for your customers
          </p>
        </div>
        <Link href="/subscriptions/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            New Subscription
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by customer or subscription number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing Cycle</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Billing</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : !subscriptions || subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <RefreshCw className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No subscriptions found</p>
                    <p className="text-gray-400 text-sm mt-1">Create your first subscription to get started</p>
                    <Link href="/subscriptions/new">
                      <Button className="mt-4 bg-orange-500 hover:bg-orange-600" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        New Subscription
                      </Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                subscriptions.map((item: any) => (
                  <tr key={item.subscription.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/subscriptions/${item.subscription.id}`}
                        className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                      >
                        {item.subscription.subscriptionNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.customerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.productName}</td>
                    <td className="px-4 py-3">
                      <BillingCycleBadge cycle={item.subscription.billingCycle} />
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(item.subscription.price, item.subscription.currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={item.subscription.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(item.subscription.nextBillingDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/subscriptions/${item.subscription.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
