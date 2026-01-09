'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { TrendingDown, Download, Calendar } from 'lucide-react';
import useSWR from 'swr';
import { formatCurrency } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PurchaseEntry {
  id: number;
  date: string;
  number: string;
  supplierName: string;
  taxableAmount: string;
  gstClassification: string;
  gstRate: string;
  gstAmount: string;
  totalAmount: string;
  currency: string;
}

interface Summary {
  totalPurchases: number;
  taxableAmount: number;
  standardRated: { amount: number; gst: number };
  zeroRated: { amount: number; gst: number };
  exempt: { amount: number; gst: number };
  totalGst: number;
}

export default function InputGstReportPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [queryParams, setQueryParams] = useState<string>('');

  const { data, isLoading } = useSWR<{ entries: PurchaseEntry[]; summary: Summary }>(
    `/api/reports/purchase-register${queryParams}`,
    fetcher
  );

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    setQueryParams(`?${params.toString()}`);
  };

  const handleExport = () => {
    if (!data?.entries) return;

    const headers = ['Date', 'Bill Number', 'Supplier', 'Classification', 'Taxable Amount', 'GST Rate', 'GST Amount', 'Total'];
    const rows = data.entries.map(entry => [
      new Date(entry.date).toLocaleDateString(),
      entry.number,
      entry.supplierName,
      entry.gstClassification,
      entry.taxableAmount,
      entry.gstRate + '%',
      entry.gstAmount,
      entry.totalAmount,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `input-gst-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Input GST Report (Purchases)</h1>
          <p className="text-muted-foreground">GST paid on supplier purchases</p>
        </div>
        <Button onClick={handleExport} disabled={!data?.entries || data.entries.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

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

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Purchases</div>
              <div className="text-2xl font-bold">
                {formatCurrency((data.summary.totalPurchases || 0).toFixed(2), 'BTN')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Taxable Amount</div>
              <div className="text-2xl font-bold">
                {formatCurrency((data.summary.taxableAmount || 0).toFixed(2), 'BTN')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Input GST</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency((data.summary.totalGst || 0).toFixed(2), 'BTN')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Entries</div>
              <div className="text-2xl font-bold">{data.entries?.length || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* GST Breakdown */}
      {data?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>GST Breakdown by Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Classification</th>
                    <th className="text-right p-3">Purchase Amount</th>
                    <th className="text-right p-3">GST Amount</th>
                    <th className="text-right p-3">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Standard-Rated</td>
                    <td className="p-3 text-right">
                      {formatCurrency((data.summary.standardRated?.amount || 0).toFixed(2), 'BTN')}
                    </td>
                    <td className="p-3 text-right font-semibold text-blue-600">
                      {formatCurrency((data.summary.standardRated?.gst || 0).toFixed(2), 'BTN')}
                    </td>
                    <td className="p-3 text-right">5%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Zero-Rated</td>
                    <td className="p-3 text-right">
                      {formatCurrency((data.summary.zeroRated?.amount || 0).toFixed(2), 'BTN')}
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency((data.summary.zeroRated?.gst || 0).toFixed(2), 'BTN')}
                    </td>
                    <td className="p-3 text-right">0%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Exempt</td>
                    <td className="p-3 text-right">
                      {formatCurrency((data.summary.exempt?.amount || 0).toFixed(2), 'BTN')}
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency((data.summary.exempt?.gst || 0).toFixed(2), 'BTN')}
                    </td>
                    <td className="p-3 text-right">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Purchase Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : !data?.entries || data.entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No purchase transactions found for the selected period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Bill Number</th>
                    <th className="text-left p-2">Supplier</th>
                    <th className="text-left p-2">Classification</th>
                    <th className="text-right p-2">Taxable</th>
                    <th className="text-right p-2">Rate</th>
                    <th className="text-right p-2">GST</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="p-2 font-medium">{entry.number}</td>
                      <td className="p-2">{entry.supplierName}</td>
                      <td className="p-2">
                        <span className="text-xs px-2 py-1 rounded bg-gray-100">
                          {entry.gstClassification}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(entry.taxableAmount, entry.currency)}
                      </td>
                      <td className="p-2 text-right">{entry.gstRate}%</td>
                      <td className="p-2 text-right font-semibold text-blue-600">
                        {formatCurrency(entry.gstAmount, entry.currency)}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(entry.totalAmount, entry.currency)}
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
