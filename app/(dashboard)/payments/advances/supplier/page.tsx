'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wallet } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SupplierAdvancesPage() {
  const { data: advances, isLoading } = useSWR('/api/supplier-advances', fetcher);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supplier Advances</h1>
          <p className="text-muted-foreground">
            Manage prepayments made to suppliers
          </p>
        </div>
        <Link href="/payments/advances/supplier/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Advance
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Supplier Advances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading advances...
            </div>
          ) : !advances || advances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No supplier advances found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Advance Number</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-right p-2">Allocated</th>
                    <th className="text-right p-2">Unallocated</th>
                    <th className="text-left p-2">Payment Method</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {advances.map((advance: any) => (
                    <tr key={advance.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{advance.advanceNumber}</td>
                      <td className="p-2">
                        {new Date(advance.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(advance.amount, advance.currency)}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(advance.allocatedAmount, advance.currency)}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(advance.unallocatedAmount, advance.currency)}
                      </td>
                      <td className="p-2">{advance.paymentMethodName || advance.paymentMethod}</td>
                      <td className="p-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <Link href={`/payments/advances/supplier/${advance.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          {parseFloat(advance.unallocatedAmount) > 0 && (
                            <Link href={`/payments/advances/supplier/${advance.id}/allocate`}>
                              <Button size="sm">
                                Allocate
                              </Button>
                            </Link>
                          )}
                        </div>
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
