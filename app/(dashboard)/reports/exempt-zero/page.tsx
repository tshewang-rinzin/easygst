'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { FileText, Download, Calendar, AlertCircle } from 'lucide-react';
import useSWR from 'swr';
import { formatCurrency } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Transaction {
  documentType: 'invoice' | 'bill';
  documentNumber: string;
  documentDate: string;
  partyName: string;
  itemDescription: string;
  classification: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  taxRate: string;
  taxAmount: string;
  currency: string;
}

interface Summary {
  zeroRated: {
    salesAmount: string;
    salesGst: string;
    purchasesAmount: string;
    purchasesGst: string;
    totalAmount: string;
    totalGst: string;
  };
  exempt: {
    salesAmount: string;
    salesGst: string;
    purchasesAmount: string;
    purchasesGst: string;
    totalAmount: string;
    totalGst: string;
  };
}

export default function ExemptZeroRatedReportPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [queryParams, setQueryParams] = useState<string>('');

  const { data, isLoading } = useSWR<{ transactions: Transaction[]; summary: Summary }>(
    `/api/reports/exempt-zero-rated${queryParams}`,
    fetcher
  );

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    setQueryParams(`?${params.toString()}`);
  };

  const handleExport = () => {
    if (!data?.transactions) return;

    const headers = ['Type', 'Document', 'Date', 'Party', 'Item', 'Classification', 'Quantity', 'Unit Price', 'Amount', 'Tax Rate', 'Tax Amount'];
    const rows = data.transactions.map(tx => [
      tx.documentType === 'invoice' ? 'Sale' : 'Purchase',
      tx.documentNumber,
      new Date(tx.documentDate).toLocaleDateString(),
      tx.partyName,
      tx.itemDescription,
      tx.classification,
      tx.quantity,
      tx.unitPrice,
      tx.amount,
      tx.taxRate + '%',
      tx.taxAmount,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exempt-zero-rated-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Exempt vs Zero-Rated Report</h1>
          <p className="text-muted-foreground">Analysis of exempt and zero-rated GST transactions</p>
        </div>
        <Button onClick={handleExport} disabled={!data?.transactions || data.transactions.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Understanding the Difference
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <div>
            <strong>Zero-Rated (0%):</strong> Taxable at 0% rate. Input tax credits can be claimed.
            Typically applies to exports and international services.
          </div>
          <div>
            <strong>Exempt:</strong> Not subject to GST. Input tax credits cannot be claimed.
            Typically applies to financial services, healthcare, and education.
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <DatePicker date={startDate} onDateChange={setStartDate} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePicker date={endDate} onDateChange={setEndDate} />
            </div>
            <Button onClick={handleFilter}>Apply Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Zero-Rated Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Sales</div>
                  <div className="text-lg font-bold">
                    {formatCurrency(data.summary.zeroRated.salesAmount, 'BTN')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Purchases</div>
                  <div className="text-lg font-bold">
                    {formatCurrency(data.summary.zeroRated.purchasesAmount, 'BTN')}
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground">Total Zero-Rated</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data.summary.zeroRated.totalAmount, 'BTN')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exempt Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Sales</div>
                  <div className="text-lg font-bold">
                    {formatCurrency(data.summary.exempt.salesAmount, 'BTN')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Purchases</div>
                  <div className="text-lg font-bold">
                    {formatCurrency(data.summary.exempt.purchasesAmount, 'BTN')}
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground">Total Exempt</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(data.summary.exempt.totalAmount, 'BTN')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transaction Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : !data?.transactions || data.transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No exempt or zero-rated transactions found for the selected period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Document</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Item</th>
                    <th className="text-left p-2">Classification</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-right p-2">GST</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((tx, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <span className={`text-xs px-2 py-1 rounded ${tx.documentType === 'invoice' ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {tx.documentType === 'invoice' ? 'Sale' : 'Purchase'}
                        </span>
                      </td>
                      <td className="p-2 font-medium">{tx.documentNumber}</td>
                      <td className="p-2">{new Date(tx.documentDate).toLocaleDateString()}</td>
                      <td className="p-2">{tx.itemDescription}</td>
                      <td className="p-2">
                        <span className={`text-xs px-2 py-1 rounded ${tx.classification === 'ZERO_RATED' ? 'bg-purple-100' : 'bg-orange-100'}`}>
                          {tx.classification}
                        </span>
                      </td>
                      <td className="p-2 text-right">{parseFloat(tx.quantity).toFixed(2)}</td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(tx.amount, tx.currency)}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(tx.taxAmount, tx.currency)}
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
