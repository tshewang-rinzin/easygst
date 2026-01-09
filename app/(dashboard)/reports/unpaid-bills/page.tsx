'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, Mail } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UnpaidBill {
  id: number;
  billNumber: string;
  billDate: string;
  dueDate: string | null;
  supplierName: string;
  supplierEmail: string | null;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;
  currency: string;
  paymentStatus: string;
  daysOverdue: number | null;
}

interface Summary {
  totalUnpaid: string;
  totalOverdue: string;
  unpaidCount: number;
  overdueCount: number;
  averageDaysOverdue: number;
}

export default function UnpaidBillsReportPage() {
  const { data, isLoading } = useSWR<{ bills: UnpaidBill[]; summary: Summary }>(
    '/api/reports/unpaid-bills',
    fetcher
  );

  const handleExport = () => {
    if (!data?.bills) return;

    const headers = ['Bill Number', 'Date', 'Due Date', 'Supplier', 'Total Amount', 'Paid', 'Amount Due', 'Days Overdue', 'Status'];
    const rows = data.bills.map(bill => [
      bill.billNumber,
      new Date(bill.billDate).toLocaleDateString(),
      bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A',
      bill.supplierName,
      bill.totalAmount,
      bill.amountPaid,
      bill.amountDue,
      bill.daysOverdue !== null ? bill.daysOverdue.toString() : '0',
      bill.paymentStatus,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unpaid-bills-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (bill: UnpaidBill) => {
    if (bill.daysOverdue && bill.daysOverdue > 30) {
      return <Badge className="bg-red-500">Overdue {bill.daysOverdue}d</Badge>;
    } else if (bill.daysOverdue && bill.daysOverdue > 0) {
      return <Badge className="bg-yellow-500">Overdue {bill.daysOverdue}d</Badge>;
    } else if (bill.paymentStatus === 'partial') {
      return <Badge className="bg-blue-500">Partial</Badge>;
    } else {
      return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Unpaid Bills Report</h1>
          <p className="text-muted-foreground">Track outstanding supplier bills and payments due</p>
        </div>
        <Button onClick={handleExport} disabled={!data?.bills || data.bills.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Unpaid</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(data.summary.totalUnpaid, 'BTN')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.summary.unpaidCount} bills
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Overdue</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(data.summary.totalOverdue, 'BTN')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.summary.overdueCount} bills
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Average Days Overdue</div>
              <div className="text-2xl font-bold">{data.summary.averageDaysOverdue}</div>
              <div className="text-xs text-muted-foreground mt-1">days</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Payment Rate</div>
              <div className="text-2xl font-bold text-green-600">
                {data.summary.unpaidCount > 0
                  ? ((1 - data.summary.overdueCount / data.summary.unpaidCount) * 100).toFixed(1)
                  : '100.0'}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">on time</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unpaid Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Outstanding Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : !data?.bills || data.bills.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium text-lg mb-2">
                All bills are paid!
              </p>
              <p className="text-sm text-muted-foreground">
                No outstanding or overdue supplier bills to report
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Bill #</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Due Date</th>
                    <th className="text-left p-2">Supplier</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-right p-2">Paid</th>
                    <th className="text-right p-2">Amount Due</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bills
                    .sort((a, b) => {
                      // Sort by days overdue (descending)
                      const aDays = a.daysOverdue || 0;
                      const bDays = b.daysOverdue || 0;
                      return bDays - aDays;
                    })
                    .map((bill) => (
                      <tr
                        key={bill.id}
                        className={`border-b hover:bg-muted/50 ${
                          bill.daysOverdue && bill.daysOverdue > 30
                            ? 'bg-red-50/50'
                            : bill.daysOverdue && bill.daysOverdue > 0
                            ? 'bg-yellow-50/50'
                            : ''
                        }`}
                      >
                        <td className="p-2 font-medium">
                          <Link href={`/purchases/bills/${bill.id}`} className="hover:underline">
                            {bill.billNumber}
                          </Link>
                        </td>
                        <td className="p-2">{new Date(bill.billDate).toLocaleDateString()}</td>
                        <td className="p-2">
                          {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-2">{bill.supplierName}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(bill.totalAmount, bill.currency)}
                        </td>
                        <td className="p-2 text-right text-green-600">
                          {formatCurrency(bill.amountPaid, bill.currency)}
                        </td>
                        <td className="p-2 text-right font-bold text-red-600">
                          {formatCurrency(bill.amountDue, bill.currency)}
                        </td>
                        <td className="p-2">{getStatusBadge(bill)}</td>
                        <td className="p-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <Link href={`/purchases/bills/${bill.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Link href={`/payments/pay-suppliers`}>
                              <Button size="sm">
                                Pay
                              </Button>
                            </Link>
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

      {/* Tips Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Payment Management Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>• Schedule payments before due dates to avoid late fees</p>
          <p>• Negotiate payment terms with suppliers for better cash flow</p>
          <p>• Take advantage of early payment discounts when available</p>
          <p>• Maintain good supplier relationships by paying on time</p>
          <p>• Use supplier advances for better terms on future purchases</p>
        </CardContent>
      </Card>
    </div>
  );
}
