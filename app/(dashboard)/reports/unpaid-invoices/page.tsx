'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, Mail } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UnpaidInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  customerName: string;
  customerEmail: string | null;
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

export default function UnpaidInvoicesReportPage() {
  const { data, isLoading } = useSWR<{ invoices: UnpaidInvoice[]; summary: Summary }>(
    '/api/reports/unpaid-invoices',
    fetcher
  );

  const handleExport = () => {
    if (!data?.invoices) return;

    const headers = ['Invoice Number', 'Date', 'Due Date', 'Customer', 'Total Amount', 'Paid', 'Amount Due', 'Days Overdue', 'Status'];
    const rows = data.invoices.map(inv => [
      inv.invoiceNumber,
      new Date(inv.invoiceDate).toLocaleDateString(),
      inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A',
      inv.customerName,
      inv.totalAmount,
      inv.amountPaid,
      inv.amountDue,
      inv.daysOverdue !== null ? inv.daysOverdue.toString() : '0',
      inv.paymentStatus,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unpaid-invoices-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (invoice: UnpaidInvoice) => {
    if (invoice.daysOverdue && invoice.daysOverdue > 30) {
      return <Badge className="bg-red-500">Overdue {invoice.daysOverdue}d</Badge>;
    } else if (invoice.daysOverdue && invoice.daysOverdue > 0) {
      return <Badge className="bg-yellow-500">Overdue {invoice.daysOverdue}d</Badge>;
    } else if (invoice.paymentStatus === 'partial') {
      return <Badge className="bg-blue-500">Partial</Badge>;
    } else {
      return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Unpaid Invoices Report</h1>
          <p className="text-muted-foreground">Track outstanding and overdue invoices</p>
        </div>
        <Button onClick={handleExport} disabled={!data?.invoices || data.invoices.length === 0}>
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
                {data.summary.unpaidCount} invoices
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
                {data.summary.overdueCount} invoices
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
              <div className="text-sm text-muted-foreground">Collection Rate</div>
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

      {/* Unpaid Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Outstanding Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : !data?.invoices || data.invoices.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium text-lg mb-2">
                All invoices are paid!
              </p>
              <p className="text-sm text-muted-foreground">
                No outstanding or overdue invoices to report
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Invoice #</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Due Date</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-right p-2">Paid</th>
                    <th className="text-right p-2">Amount Due</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices
                    .sort((a, b) => {
                      // Sort by days overdue (descending)
                      const aDays = a.daysOverdue || 0;
                      const bDays = b.daysOverdue || 0;
                      return bDays - aDays;
                    })
                    .map((invoice) => (
                      <tr
                        key={invoice.id}
                        className={`border-b hover:bg-muted/50 ${
                          invoice.daysOverdue && invoice.daysOverdue > 30
                            ? 'bg-red-50/50'
                            : invoice.daysOverdue && invoice.daysOverdue > 0
                            ? 'bg-yellow-50/50'
                            : ''
                        }`}
                      >
                        <td className="p-2 font-medium">
                          <Link href={`/sales/invoices/${invoice.id}`} className="hover:underline">
                            {invoice.invoiceNumber}
                          </Link>
                        </td>
                        <td className="p-2">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                        <td className="p-2">
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-2">{invoice.customerName}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(invoice.totalAmount, invoice.currency)}
                        </td>
                        <td className="p-2 text-right text-green-600">
                          {formatCurrency(invoice.amountPaid, invoice.currency)}
                        </td>
                        <td className="p-2 text-right font-bold text-red-600">
                          {formatCurrency(invoice.amountDue, invoice.currency)}
                        </td>
                        <td className="p-2">{getStatusBadge(invoice)}</td>
                        <td className="p-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <Link href={`/sales/invoices/${invoice.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            {invoice.customerEmail && (
                              <Button variant="ghost" size="sm" title="Send reminder">
                                <Mail className="h-4 w-4" />
                              </Button>
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

      {/* Tips Card */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-900 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Collection Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-yellow-900">
          <p>• Send payment reminders 7 days before due date</p>
          <p>• Follow up within 3 days of invoice becoming overdue</p>
          <p>• Offer flexible payment options to improve collection rate</p>
          <p>• Consider payment plans for long-overdue accounts</p>
          <p>• Review credit terms for customers with repeated late payments</p>
        </CardContent>
      </Card>
    </div>
  );
}
