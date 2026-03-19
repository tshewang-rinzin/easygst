'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import useSWR from 'swr';
import { Suspense } from 'react';
import {
  FileText,
  DollarSign,
  ShoppingCart,
  Banknote,
  AlertCircle,
  Receipt,
  TrendingUp,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Circle,
  Calendar,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DashboardMetrics {
  taxInvoices: { count: number; revenue: string };
  cashSales: { count: number; revenue: string };
  totalSales: { count: number; revenue: string };
  outstanding: { total: string; count: number };
  overdue: { count: number; amount: string };
  gst: { output: string; input: string; net: string };
  currency: string;
}

interface RevenueData {
  month: string;
  revenue: number;
  invoiceCount: number;
}

interface TopCustomer {
  name: string;
  revenue: number;
  invoiceCount: number;
}

interface InvoiceStatusData {
  name: string;
  value: number;
  amount: number;
}

interface RecentInvoice {
  id: string;
  number: string;
  customerName: string;
  amount: number;
  status: string;
  paymentStatus: string;
  date: string;
  currency: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SetupStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
  href: string;
}

interface SetupProgressData {
  steps: SetupStep[];
  completedCount: number;
  totalCount: number;
  requiredCompletedCount: number;
  requiredTotalCount: number;
  percentage: number;
  allRequiredComplete: boolean;
}

function SetupProgressCard() {
  const { data: progress } = useSWR<SetupProgressData>('/api/setup-progress', fetcher);

  if (!progress || progress.percentage === 100) return null;

  const incompleteSteps = progress.steps.filter((s) => !s.completed);

  if (progress.allRequiredComplete && incompleteSteps.every((s) => !s.required)) {
    // All required done, only optional remain - show celebratory dismissable card
    return (
      <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">All required setup complete! 🎉</h3>
              <p className="text-sm text-green-700 mt-1">
                {incompleteSteps.length > 0
                  ? `${incompleteSteps.length} optional step${incompleteSteps.length > 1 ? 's' : ''} remaining for a perfect setup.`
                  : 'Your business is fully configured.'}
              </p>
            </div>
            {incompleteSteps.length > 0 && (
              <Link href="/onboarding">
                <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
                  Complete Setup
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 border-amber-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Complete Your Setup</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {progress.completedCount} of {progress.totalCount} steps completed
            </p>
          </div>
          <Link href="/onboarding">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-800 text-white">
              Complete Setup
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="space-y-2">
          {incompleteSteps.map((step) => (
            <Link key={step.id} href={step.href} className="flex items-center gap-2 text-sm group">
              <Circle className="w-3 h-3 text-gray-300 flex-shrink-0" />
              <span className="text-amber-700 underline underline-offset-2 group-hover:text-amber-900 transition-colors">{step.label}</span>
              {step.required && (
                <span className="text-xs text-red-500">(required)</span>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Chart Components
function RevenueTrendChart() {
  const { data: revenueData } = useSWR<RevenueData[]>('/api/dashboard/revenue-trend', fetcher);

  if (!revenueData) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-800" />
          <CardTitle className="text-base">Revenue Trend (6 Months)</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => [`BTN ${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Revenue']}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#b45309" 
              strokeWidth={3}
              dot={{ fill: '#b45309', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function TopCustomersChart() {
  const { data: customersData } = useSWR<TopCustomer[]>('/api/dashboard/top-customers', fetcher);

  if (!customersData) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = Math.max(...customersData.map(c => c.revenue));

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-base">Top 5 Customers</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customersData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No customer data available</p>
          ) : (
            customersData.map((customer, index) => (
              <div key={customer.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{customer.name}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      BTN {customer.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {customer.invoiceCount} invoice{customer.invoiceCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(customer.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InvoiceStatusChart() {
  const { data: statusData } = useSWR<InvoiceStatusData[]>('/api/dashboard/invoice-status', fetcher);

  if (!statusData) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const COLORS = {
    'Paid': '#10b981', // green
    'Draft': '#94a3b8', // gray
    'Sent': '#3b82f6', // blue
    'Overdue': '#ef4444', // red
    'Viewed': '#8b5cf6', // purple
    'Partial': '#f59e0b', // amber
    'Cancelled': '#6b7280', // dark gray
  };

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-base">Invoice Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {statusData.length === 0 || statusData.every(item => item.value === 0) ? (
          <p className="text-gray-500 text-sm text-center py-16">No invoice data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#9ca3af'} 
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [Number(value), 'Invoices']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function RecentInvoicesTable() {
  const { data: recentData } = useSWR<RecentInvoice[]>('/api/dashboard/recent-invoices', fetcher);

  if (!recentData) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'viewed': return 'bg-purple-100 text-purple-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-green-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-600" />
          <CardTitle className="text-base">Recent Invoices</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {recentData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No recent invoices</p>
        ) : (
          <div className="space-y-3">
            {recentData.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{invoice.number}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{invoice.customerName}</p>
                  <p className="text-xs text-gray-500">{invoice.date}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {invoice.currency} {invoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="pt-4 border-t">
          <Link href="/sales/invoices">
            <Button variant="link" className="text-green-600 hover:text-green-700 p-0">
              View all invoices <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Sales Overview Skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* GST Summary Skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardOverview() {
  const { data: metrics } = useSWR<DashboardMetrics>('/api/dashboard/metrics', fetcher);

  const formatCurrency = (amount: string, currency: string = 'BTN') => {
    const numAmount = parseFloat(amount);
    return `${currency} ${numAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const currency = metrics?.currency || 'BTN';

  return (
    <div className="space-y-8">
      {/* Sales Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
          <Link href="/sales/invoices">
            <Button variant="link" className="text-amber-800 hover:text-amber-900">
              View all sales <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tax Invoices */}
          <Card className="border-blue-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tax Invoices (Credit)
              </CardTitle>
              <FileText className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metrics?.taxInvoices?.count ?? 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(metrics?.taxInvoices?.revenue || '0.00', currency)}
              </p>
              <Link href="/sales/invoices">
                <Button variant="link" className="px-0 mt-2 text-blue-600">
                  Manage invoices →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Cash Sales */}
          <Card className="border-green-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cash Sales (Immediate)
              </CardTitle>
              <Banknote className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {metrics?.cashSales?.count ?? 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(metrics?.cashSales?.revenue || '0.00', currency)}
              </p>
              <Link href="/sales/cash-sales">
                <Button variant="link" className="px-0 mt-2 text-green-600">
                  View cash sales →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Total Sales */}
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-amber-800" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-800">
                {metrics?.totalSales?.count ?? 0}
              </div>
              <p className="text-sm text-gray-900 font-semibold mt-1">
                {formatCurrency(metrics?.totalSales?.revenue || '0.00', currency)}
              </p>
              <p className="text-xs text-gray-500 mt-2">From all paid sales</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* GST Summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">GST Summary</h2>
          <Link href="/reports/gst-summary">
            <Button variant="link" className="text-amber-800 hover:text-amber-900">
              View GST report <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Output GST */}
          <Card className="border-purple-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Output GST (Sales)
              </CardTitle>
              <Receipt className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(metrics?.gst?.output || '0.00', currency)}
              </div>
              <p className="text-xs text-gray-500 mt-1">GST collected from customers</p>
            </CardContent>
          </Card>

          {/* Input GST */}
          <Card className="border-indigo-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Input GST (Purchases)
              </CardTitle>
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {formatCurrency(metrics?.gst?.input || '0.00', currency)}
              </div>
              <p className="text-xs text-gray-500 mt-1">GST paid on purchases</p>
            </CardContent>
          </Card>

          {/* Net GST */}
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Net GST Payable
              </CardTitle>
              <Wallet className="h-5 w-5 text-amber-800" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-800">
                {formatCurrency(metrics?.gst?.net || '0.00', currency)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Output GST - Input GST</p>
              <Link href="/gst-returns/prepare">
                <Button variant="link" className="px-0 mt-2 text-amber-800">
                  Prepare return →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Outstanding & Overdue */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Payments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Outstanding */}
          <Card className="border-yellow-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Unpaid Invoices
              </CardTitle>
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {metrics?.outstanding?.count ?? 0}
              </div>
              <p className="text-sm text-gray-900 font-semibold mt-1">
                {formatCurrency(metrics?.outstanding?.total || '0.00', currency)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Total amount due</p>
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card className="border-red-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Overdue Invoices
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics?.overdue?.count ?? 0}
              </div>
              <p className="text-sm text-gray-900 font-semibold mt-1">
                {formatCurrency(metrics?.overdue?.amount || '0.00', currency)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Past due date</p>
              <Link href="/reports/outstanding">
                <Button variant="link" className="px-0 mt-2 text-red-600">
                  View details →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics Charts */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h2>
        
        {/* Row 1: Revenue Trend + Invoice Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <RevenueTrendChart />
          </div>
          <div>
            <InvoiceStatusChart />
          </div>
        </div>

        {/* Row 2: Top Customers + Recent Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopCustomersChart />
          <RecentInvoicesTable />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/sales/invoices/new">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:border-amber-300 border-2">
              <CardContent className="pt-6 text-center">
                <FileText className="h-8 w-8 text-amber-800 mx-auto mb-3" />
                <p className="font-medium text-gray-900">Create Tax Invoice</p>
                <p className="text-xs text-gray-500 mt-1">Credit sale with payment terms</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/sales/cash-sales/new">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:border-green-300 border-2">
              <CardContent className="pt-6 text-center">
                <Banknote className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900">Record Cash Sale</p>
                <p className="text-xs text-gray-500 mt-1">Immediate payment receipt</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/payments/receive">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:border-blue-300 border-2">
              <CardContent className="pt-6 text-center">
                <Wallet className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900">Receive Payment</p>
                <p className="text-xs text-gray-500 mt-1">Record customer payment</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports/gst-summary">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:border-purple-300 border-2">
              <CardContent className="pt-6 text-center">
                <Receipt className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900">GST Reports</p>
                <p className="text-xs text-gray-500 mt-1">View tax reports</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Overview of your sales, purchases, and GST obligations
        </p>
      </div>

      {/* Setup Progress */}
      <Suspense fallback={null}>
        <SetupProgressCard />
      </Suspense>

      {/* Main Dashboard Overview */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardOverview />
      </Suspense>

    </section>
  );
}