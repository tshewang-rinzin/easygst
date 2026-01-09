'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Banknote, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PaySuppliersPage() {
  const { data: suppliers, isLoading } = useSWR('/api/suppliers', fetcher);
  const { data: bills } = useSWR('/api/purchases/bills', fetcher);

  // Group bills by supplier and calculate outstanding amounts
  const supplierOutstanding = bills?.reduce((acc: any, item: any) => {
    const supplierId = item.bill.supplierId;
    const amountDue = parseFloat(item.bill.amountDue);

    if (item.bill.status !== 'cancelled' && amountDue > 0) {
      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplier: item.supplier,
          bills: [],
          totalOutstanding: 0,
          overdueCount: 0,
        };
      }

      acc[supplierId].bills.push(item.bill);
      acc[supplierId].totalOutstanding += amountDue;

      // Check if overdue
      if (item.bill.dueDate && new Date(item.bill.dueDate) < new Date()) {
        acc[supplierId].overdueCount++;
      }
    }

    return acc;
  }, {});

  const suppliersWithOutstanding = supplierOutstanding ? Object.values(supplierOutstanding) : [];

  // Calculate totals
  const totalOutstanding = suppliersWithOutstanding.reduce(
    (sum: number, s: any) => sum + s.totalOutstanding,
    0
  );
  const totalOverdueBills = suppliersWithOutstanding.reduce(
    (sum: number, s: any) => sum + s.overdueCount,
    0
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Banknote className="h-6 w-6 text-orange-500" />
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">Pay Suppliers</h1>
        </div>
        <p className="text-sm text-gray-500">Manage supplier payments and outstanding bills</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">
                  BTN {totalOutstanding.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Suppliers with Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">
                  {suppliersWithOutstanding.length}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue Bills</p>
                <p className="text-2xl font-bold text-red-600">{totalOverdueBills}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers with Outstanding Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">Loading suppliers...</p>
            </div>
          ) : suppliersWithOutstanding && suppliersWithOutstanding.length > 0 ? (
            <div className="space-y-4">
              {suppliersWithOutstanding.map((item: any) => (
                <div
                  key={item.supplier?.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.supplier?.name || 'Unknown Supplier'}
                      </h3>
                      {item.overdueCount > 0 && (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                          {item.overdueCount} Overdue
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      {item.supplier?.email && (
                        <div>
                          <span className="font-medium">Email:</span> {item.supplier.email}
                        </div>
                      )}
                      {item.supplier?.phone && (
                        <div>
                          <span className="font-medium">Phone:</span> {item.supplier.phone}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Outstanding Bills:</span> {item.bills.length}
                      </div>
                    </div>

                    <div className="mt-2">
                      <span className="text-sm text-gray-600">Total Outstanding: </span>
                      <span className="text-lg font-semibold text-red-600">
                        BTN {item.totalOutstanding.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Link href={`/purchases/bills?supplier=${item.supplier?.id}`}>
                      <Button variant="outline" size="sm">
                        View Bills
                      </Button>
                    </Link>
                    {item.bills.length > 0 && (
                      <Link href={`/purchases/bills/${item.bills[0].id}`}>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          Pay Now
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Banknote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No outstanding supplier bills</p>
              <Link href="/purchases/bills/new">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                  Create Supplier Bill
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Suppliers Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Suppliers</CardTitle>
            <Link href="/suppliers/new">
              <Button size="sm" variant="outline">
                Add Supplier
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {suppliers && suppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier: any) => {
                const outstanding = supplierOutstanding?.[supplier.id];
                return (
                  <div
                    key={supplier.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
                      {outstanding && (
                        <Badge variant="outline" className="text-xs">
                          Outstanding
                        </Badge>
                      )}
                    </div>
                    {supplier.email && (
                      <p className="text-sm text-gray-600 mb-1">{supplier.email}</p>
                    )}
                    {supplier.phone && (
                      <p className="text-sm text-gray-600 mb-2">{supplier.phone}</p>
                    )}
                    {outstanding ? (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-500">Amount Due:</p>
                        <p className="text-lg font-semibold text-red-600">
                          BTN {outstanding.totalOutstanding.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-green-600">No outstanding bills</p>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Link href={`/purchases/bills?supplier=${supplier.id}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          View Bills
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No suppliers found</p>
              <Link href="/suppliers/new">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                  Add First Supplier
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
