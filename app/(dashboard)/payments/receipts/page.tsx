'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Receipt, Download, Search, Calendar, Filter } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { DatePicker } from '@/components/ui/date-picker';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PaymentReceiptsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const { data: payments, isLoading } = useSWR('/api/customer-payments', fetcher);

  const filteredPayments = payments?.filter((payment: any) => {
    const matchesSearch =
      !searchTerm ||
      payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const paymentDate = new Date(payment.paymentDate);
    const matchesDateRange =
      (!startDate || paymentDate >= startDate) &&
      (!endDate || paymentDate <= endDate);

    return matchesSearch && matchesDateRange;
  });

  const getPaymentMethodLabel = (methodName: string | null, methodCode: string) => {
    return methodName || methodCode;
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="h-6 w-6 text-orange-500" />
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">Payment Receipts</h1>
        </div>
        <p className="text-sm text-gray-500">View and download customer payment receipts</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search" className="mb-2">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Receipt number or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="startDate" className="mb-2">
                From Date
              </Label>
              <DatePicker
                id="startDate"
                date={startDate || undefined}
                onDateChange={(date) => setStartDate(date || null)}
                placeholder="Select start date"
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="mb-2">
                To Date
              </Label>
              <DatePicker
                id="endDate"
                date={endDate || undefined}
                onDateChange={(date) => setEndDate(date || null)}
                placeholder="Select end date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Receipts List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Receipts ({filteredPayments?.length || 0})
            </CardTitle>
            <Link href="/payments/receive">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                Receive Payment
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">Loading receipts...</p>
            </div>
          ) : filteredPayments && filteredPayments.length > 0 ? (
            <div className="space-y-4">
              {filteredPayments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Receipt className="h-5 w-5 text-orange-500" />
                      <Link
                        href={`/payments/receipts/${payment.id}`}
                        className="text-lg font-semibold text-orange-600 hover:text-orange-700"
                      >
                        {payment.receiptNumber}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {getPaymentMethodLabel(payment.paymentMethodName, payment.paymentMethod)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Customer:</span>{' '}
                        {payment.customer?.name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span>{' '}
                        <span className="text-green-600 font-semibold">
                          {payment.currency} {parseFloat(payment.amount).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{' '}
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Allocated:</span>{' '}
                        {payment.currency} {parseFloat(payment.allocatedAmount).toFixed(2)}
                      </div>
                    </div>

                    {payment.transactionId && (
                      <div className="text-xs text-gray-500 mt-1">
                        Transaction: {payment.transactionId}
                      </div>
                    )}

                    {parseFloat(payment.unallocatedAmount) > 0 && (
                      <div className="mt-2">
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          Unallocated: {payment.currency} {parseFloat(payment.unallocatedAmount).toFixed(2)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Link href={`/payments/receipts/${payment.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    <Link href={`/api/payments/receipts/${payment.id}/pdf`} target="_blank">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No payment receipts found</p>
              <Link href="/payments/receive">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                  Receive First Payment
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
