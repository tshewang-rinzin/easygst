'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Wallet, Eye, ArrowRightLeft } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <Wallet className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">No advances yet</h3>
      <p className="mt-2 text-sm text-gray-500">
        Get started by recording your first customer advance payment.
      </p>
      <div className="mt-6">
        <Link href="/payments/advances/customer/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Advance
          </Button>
        </Link>
      </div>
    </div>
  );
}

function AllocationBadge({ allocated, total }: { allocated: number; total: number }) {
  const percentage = total > 0 ? (allocated / total) * 100 : 0;

  if (percentage === 100) {
    return <Badge variant="secondary" className="bg-green-100 text-green-700">Fully Allocated</Badge>;
  } else if (percentage > 0) {
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Partial</Badge>;
  }
  return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Unallocated</Badge>;
}

export default function CustomerAdvancesPage() {
  const { data: advances, isLoading } = useSWR('/api/customer-advances', fetcher);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">
            Customer Advances
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage prepayments received from customers
          </p>
        </div>
        <Link href="/payments/advances/customer/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Record Advance
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-orange-500" />
            Advance Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton />
            </div>
          ) : !advances || advances.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advance #
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unallocated
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {advances.map((advance: any) => {
                    const amount = parseFloat(advance.amount);
                    const allocated = parseFloat(advance.allocatedAmount);
                    const unallocated = parseFloat(advance.unallocatedAmount);

                    return (
                      <tr key={advance.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{advance.advanceNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {advance.customer?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {new Date(advance.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                          {formatCurrency(advance.amount, advance.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={unallocated > 0 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                            {formatCurrency(advance.unallocatedAmount, advance.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <AllocationBadge allocated={allocated} total={amount} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {advance.paymentMethodName || advance.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/payments/advances/customer/${advance.id}`}>
                              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {unallocated > 0 && (
                              <Link href={`/payments/advances/customer/${advance.id}/allocate`}>
                                <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                                  <ArrowRightLeft className="h-4 w-4 mr-1" />
                                  Allocate
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
