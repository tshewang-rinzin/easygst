'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  FileText,
  ShoppingCart,
  ShoppingBag,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';

const reports = [
  {
    name: 'Output GST (Sales)',
    description: 'GST collected from customers through sales and invoices',
    href: '/reports/output-gst',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    name: 'Input GST (Purchases)',
    description: 'GST paid to suppliers on purchases and bills',
    href: '/reports/input-gst',
    icon: TrendingDown,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Exempt vs Zero-Rated',
    description: 'Analysis of exempt and zero-rated transactions',
    href: '/reports/exempt-zero',
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    name: 'Unpaid Invoices',
    description: 'Outstanding invoices and overdue amounts',
    href: '/reports/unpaid-invoices',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
];

export default function GstReportsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">GST Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive GST reporting and analysis tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${report.bgColor}`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{report.description}</p>
                <Link href={report.href}>
                  <Button className="w-full">
                    View Report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-sm">About GST Reports</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-blue-900">
          <div className="flex gap-2">
            <BarChart3 className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Comprehensive Analysis</p>
              <p className="text-blue-700">
                All reports provide detailed breakdowns by GST classification, date ranges, and
                party information for complete visibility into your GST obligations.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <FileText className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Export Capabilities</p>
              <p className="text-blue-700">
                Each report can be exported to CSV or PDF format for record-keeping, auditing,
                and submission to tax authorities.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <ShoppingCart className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Real-Time Updates</p>
              <p className="text-blue-700">
                Reports are generated in real-time from your current data, ensuring accuracy
                and up-to-date information for decision making.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/gst/summary">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Current Period GST Summary
              </Button>
            </Link>
            <Link href="/gst/prepare">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Prepare GST Return
              </Button>
            </Link>
            <Link href="/sales/register">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Sales Register
              </Button>
            </Link>
            <Link href="/purchases/register">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Purchase Register
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Report Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-yellow-900">
            <p>• Reports reflect transactions within your selected date range</p>
            <p>• Output GST reports include only paid invoices</p>
            <p>• Input GST reports include all supplier bills</p>
            <p>• Zero-rated transactions allow input credit claims</p>
            <p>• Exempt transactions do not allow input credits</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
