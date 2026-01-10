'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileSpreadsheet, Calendar, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface PurchaseRegisterEntry {
  id: string;
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

interface PurchaseRegisterSummary {
  totalPurchases: number;
  taxableAmount: number;
  standardRated: { amount: number; gst: number };
  zeroRated: { amount: number; gst: number };
  exempt: { amount: number; gst: number };
  totalInputGst: number;
}

export default function PurchaseRegisterPage() {
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<PurchaseRegisterEntry[]>([]);
  const [summary, setSummary] = useState<PurchaseRegisterSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchaseRegister();
  }, [startDate, endDate]);

  const fetchPurchaseRegister = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`/api/reports/purchase-register?${params}`);
      const data = await response.json();

      setEntries(data.entries || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching purchase register:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'STANDARD':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Standard-Rated</Badge>;
      case 'ZERO_RATED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Zero-Rated</Badge>;
      case 'EXEMPT':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Exempt</Badge>;
      default:
        return <Badge variant="secondary">{classification}</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Bill Number',
      'Supplier',
      'Taxable Amount',
      'GST Classification',
      'GST Rate',
      'Input GST',
      'Total Amount',
    ];

    const rows = entries.map((entry) => [
      new Date(entry.date).toLocaleDateString('en-GB'),
      entry.number,
      entry.supplierName,
      entry.taxableAmount,
      entry.gstClassification,
      entry.gstRate + '%',
      entry.gstAmount,
      entry.totalAmount,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-register-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileSpreadsheet className="h-6 w-6 text-orange-500" />
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Purchase Register
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          Comprehensive record of all purchases with Input GST breakdown
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Period Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="startDate" className="mb-2">
                From Date
              </Label>
              <DatePicker
                id="startDate"
                date={startDate}
                onDateChange={(date) => setStartDate(date || new Date())}
                placeholder="Select start date"
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="mb-2">
                To Date
              </Label>
              <DatePicker
                id="endDate"
                date={endDate}
                onDateChange={(date) => setEndDate(date || new Date())}
                placeholder="Select end date"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={fetchPurchaseRegister}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Apply Filter
              </Button>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GST Summary - Input GST (Claimable) */}
      {summary && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-600" />
              Input GST Summary (Claimable)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Purchases</p>
                <p className="text-lg font-semibold text-gray-900">
                  BTN {summary.totalPurchases.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Taxable Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  BTN {summary.taxableAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Standard-Rated</p>
                <p className="text-sm font-medium text-blue-600">
                  BTN {summary.standardRated.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Input GST: BTN {summary.standardRated.gst.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Zero-Rated</p>
                <p className="text-sm font-medium text-green-600">
                  BTN {summary.zeroRated.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Input GST: BTN {summary.zeroRated.gst.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Exempt</p>
                <p className="text-sm font-medium text-gray-600">
                  BTN {summary.exempt.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Input GST: BTN {summary.exempt.gst.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Input GST</p>
                <p className="text-lg font-semibold text-blue-600">
                  BTN {summary.totalInputGst.toFixed(2)}
                </p>
                <p className="text-xs text-green-600 mt-1">Claimable</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Register Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Purchase Transactions ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">Loading purchase register...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center">
              <FileSpreadsheet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No purchases found for this period</p>
              <p className="text-sm text-gray-400">
                Try adjusting your date range or{' '}
                <Link href="/purchases/bills/new" className="text-orange-600 hover:text-orange-700">
                  create a supplier bill
                </Link>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Taxable Amount</TableHead>
                    <TableHead>GST Classification</TableHead>
                    <TableHead className="text-right">GST Rate</TableHead>
                    <TableHead className="text-right">Input GST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow key={`${entry.id}-${index}`}>
                      <TableCell className="text-sm">
                        {new Date(entry.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Link
                          href={`/purchases/bills/${entry.id}`}
                          className="text-orange-600 hover:text-orange-700 font-medium"
                        >
                          {entry.number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{entry.supplierName}</TableCell>
                      <TableCell className="text-sm text-right">
                        {entry.currency} {parseFloat(entry.taxableAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getClassificationBadge(entry.gstClassification)}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {parseFloat(entry.gstRate).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-sm text-right font-medium text-blue-600">
                        {entry.currency} {parseFloat(entry.gstAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-right font-semibold">
                        {entry.currency} {parseFloat(entry.totalAmount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
