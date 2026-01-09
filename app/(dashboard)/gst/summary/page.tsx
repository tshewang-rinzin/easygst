'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface GstSummary {
  outputGst: string;
  inputGst: string;
  netGstPayable: string;
  salesBreakdown: {
    standard: { sales: string; gst: string };
    zeroRated: { sales: string; gst: string };
    exempt: { sales: string; gst: string };
  };
  purchasesBreakdown: {
    standard: { purchases: string; gst: string };
    zeroRated: { purchases: string; gst: string };
    exempt: { purchases: string; gst: string };
  };
}

export default function GstSummaryPage() {
  const { data: summary, isLoading } = useSWR<GstSummary>('/api/gst/summary', fetcher);

  const currentDate = new Date();
  const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GST Summary</h1>
          <p className="text-muted-foreground">
            Period: {periodStart.toLocaleDateString()} - {periodEnd.toLocaleDateString()}
          </p>
        </div>
        <Link href="/gst/prepare">
          <Button>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Prepare Return
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading summary...</div>
      ) : (
        <>
          {/* GST Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Output GST (Sales)</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary?.outputGst || '0', 'BTN')}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Input GST (Purchases)</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(summary?.inputGst || '0', 'BTN')}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net GST Payable</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(summary?.netGstPayable || '0', 'BTN')}
                    </p>
                  </div>
                  <FileSpreadsheet className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Output GST - Sales Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Classification</th>
                      <th className="text-right p-3">Sales Amount</th>
                      <th className="text-right p-3">GST Amount</th>
                      <th className="text-right p-3">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Standard-Rated (5%)</td>
                      <td className="p-3 text-right">
                        {formatCurrency(summary?.salesBreakdown?.standard?.sales || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right font-semibold text-green-600">
                        {formatCurrency(summary?.salesBreakdown?.standard?.gst || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right">5%</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Zero-Rated (0%)</td>
                      <td className="p-3 text-right">
                        {formatCurrency(summary?.salesBreakdown?.zeroRated?.sales || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(summary?.salesBreakdown?.zeroRated?.gst || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right">0%</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Exempt</td>
                      <td className="p-3 text-right">
                        {formatCurrency(summary?.salesBreakdown?.exempt?.sales || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(summary?.salesBreakdown?.exempt?.gst || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right">-</td>
                    </tr>
                    <tr className="font-bold">
                      <td className="p-3">Total Output GST</td>
                      <td className="p-3 text-right"></td>
                      <td className="p-3 text-right text-green-600">
                        {formatCurrency(summary?.outputGst || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Purchases Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Input GST - Purchases Breakdown</CardTitle>
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
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Standard-Rated (5%)</td>
                      <td className="p-3 text-right">
                        {formatCurrency(summary?.purchasesBreakdown?.standard?.purchases || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right font-semibold text-blue-600">
                        {formatCurrency(summary?.purchasesBreakdown?.standard?.gst || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right">5%</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Zero-Rated (0%)</td>
                      <td className="p-3 text-right">
                        {formatCurrency(summary?.purchasesBreakdown?.zeroRated?.purchases || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(summary?.purchasesBreakdown?.zeroRated?.gst || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right">0%</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Exempt</td>
                      <td className="p-3 text-right">
                        {formatCurrency(summary?.purchasesBreakdown?.exempt?.purchases || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(summary?.purchasesBreakdown?.exempt?.gst || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right">-</td>
                    </tr>
                    <tr className="font-bold">
                      <td className="p-3">Total Input GST</td>
                      <td className="p-3 text-right"></td>
                      <td className="p-3 text-right text-blue-600">
                        {formatCurrency(summary?.inputGst || '0', 'BTN')}
                      </td>
                      <td className="p-3 text-right"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Net GST Summary */}
          <Card className="border-2 border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-orange-900">Net GST Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg">Output GST (Tax Collected)</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(summary?.outputGst || '0', 'BTN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg">Input GST (Tax Credits)</span>
                  <span className="text-lg font-semibold text-blue-600">
                    - {formatCurrency(summary?.inputGst || '0', 'BTN')}
                  </span>
                </div>
                <div className="border-t-2 border-orange-300 pt-4 flex justify-between items-center">
                  <span className="text-2xl font-bold text-orange-900">Net GST Payable</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCurrency(summary?.netGstPayable || '0', 'BTN')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Link href="/gst/filed-returns">
              <Button variant="outline">
                View Filed Returns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/gst/prepare">
              <Button>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Prepare Return for This Period
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
