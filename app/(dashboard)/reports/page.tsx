import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Receipt,
  AlertCircle,
  TrendingUp,
  Activity,
  Shield,
  BarChart3,
} from 'lucide-react';

const reportPages = [
  {
    title: 'Unpaid Invoices',
    description: 'Track outstanding and overdue customer invoices',
    href: '/reports/unpaid-invoices',
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    title: 'Unpaid Bills',
    description: 'Track outstanding supplier bills and payables',
    href: '/reports/unpaid-bills',
    icon: Receipt,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    title: 'GST Summary',
    description: 'Overview of output tax, input tax, and net GST payable',
    href: '/reports/gst',
    icon: BarChart3,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: 'Output GST',
    description: 'GST collected on sales, broken down by classification',
    href: '/reports/output-gst',
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    title: 'Input GST',
    description: 'GST paid on purchases, broken down by classification',
    href: '/reports/input-gst',
    icon: FileText,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    title: 'Exempt & Zero-Rated',
    description: 'Report on exempt and zero-rated transactions',
    href: '/reports/exempt-zero',
    icon: Shield,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
  },
  {
    title: 'Activity Log',
    description: 'View recent system activity and user actions',
    href: '/reports/activity',
    icon: Activity,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
];

export default function ReportsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">
            View financial reports, GST summaries, and business analytics
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {reportPages.map((page) => {
            const Icon = page.icon;
            return (
              <Link key={page.href} href={page.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${page.bg} rounded-lg`}>
                        <Icon className={`h-5 w-5 ${page.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{page.title}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {page.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
