'use client';

import { use, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Printer, Calendar } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { format, subDays } from 'date-fns';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  dzongkhag?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: string;
  amountDue: string;
  status: string;
  paymentStatus: string;
}

interface Payment {
  id: string;
  paymentDate: string;
  amount: string;
  paymentMethod: string;
  paymentMethodName?: string;
  transactionId?: string;
  receiptNumber?: string;
  notes?: string;
  advanceNumber?: string;
  paymentType: string;
  allocations: Array<{
    invoiceNumber: string;
    allocatedAmount: string;
  }>;
}

interface StatementData {
  customer: Customer;
  dateRange: {
    from: string;
    to: string;
  };
  openingBalance: string;
  closingBalance: string;
  invoices: Invoice[];
  payments: Payment[];
  summary: {
    totalInvoiced: string;
    totalPaid: string;
    totalOutstanding: string;
  };
}

interface Transaction {
  type: 'invoice' | 'payment';
  date: string;
  description: string;
  reference: string;
  debit?: string;
  credit?: string;
  balance: string;
  data: Invoice | Payment;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const getStatusBadge = (status: string, paymentStatus?: string) => {
  if (paymentStatus === 'paid') {
    return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
  }
  if (paymentStatus === 'partial') {
    return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
  }
  if (paymentStatus === 'overdue' || status === 'overdue') {
    return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
  }
  return <Badge className="bg-gray-100 text-gray-800">{status || 'Draft'}</Badge>;
};

const formatCurrency = (amount: string) => {
  return `Nu. ${parseFloat(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function CustomerStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  
  // Default to last 30 days
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: statement, error, isLoading } = useSWR<StatementData>(
    `/api/customers/${id}/statement?from=${dateRange.from}&to=${dateRange.to}`,
    fetcher
  );

  const handleDateRangeChange = (newRange: { from: string; to: string }) => {
    setDateRange(newRange);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(
        `/api/customers/${id}/statement/pdf?from=${dateRange.from}&to=${dateRange.to}`
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Statement-${statement?.customer.name}-${dateRange.from}-${dateRange.to}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    }
  };

  if (isLoading) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  if (error || !statement) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Unable to load statement
          </h2>
          <p className="text-gray-500 mb-4">
            There was an error loading the customer statement.
          </p>
          <Link href={`/customers/${id}`}>
            <Button>Back to Customer</Button>
          </Link>
        </div>
      </section>
    );
  }

  // Combine invoices and payments into transactions
  const transactions: Transaction[] = [];
  let runningBalance = parseFloat(statement.openingBalance);

  // Add invoices as debit transactions
  statement.invoices.forEach((invoice) => {
    const amount = parseFloat(invoice.totalAmount);
    runningBalance += amount;
    
    transactions.push({
      type: 'invoice',
      date: invoice.invoiceDate,
      description: `Invoice - ${invoice.invoiceNumber}`,
      reference: invoice.invoiceNumber,
      debit: invoice.totalAmount,
      balance: runningBalance.toFixed(2),
      data: invoice,
    });
  });

  // Add payments as credit transactions
  statement.payments.forEach((payment) => {
    const amount = parseFloat(payment.amount);
    runningBalance -= amount;
    
    const description = payment.paymentType === 'advance' 
      ? `Advance Payment${payment.advanceNumber ? ` - ${payment.advanceNumber}` : ''}`
      : `Payment${payment.receiptNumber ? ` - ${payment.receiptNumber}` : ''}`;
    
    transactions.push({
      type: 'payment',
      date: payment.paymentDate,
      description,
      reference: payment.receiptNumber || payment.transactionId || payment.advanceNumber || '-',
      credit: payment.amount,
      balance: runningBalance.toFixed(2),
      data: payment,
    });
  });

  // Sort transactions by date (most recent first for display)
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <section className="flex-1 p-4 lg:p-8 print:p-0">
        {/* Header - Hidden in print */}
        <div className="mb-6 print:hidden">
          <Link
            href={`/customers/${id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customer
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
                Statement - {statement.customer.name}
              </h1>
              <p className="text-sm text-gray-500">
                {format(new Date(statement.dateRange.from), 'dd MMM yyyy')} - {format(new Date(statement.dateRange.to), 'dd MMM yyyy')}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button 
                onClick={handleDownloadPDF}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="mt-4 flex gap-4 items-center">
            <div className="flex gap-2 items-center">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => handleDateRangeChange({ ...dateRange, from: e.target.value })}
                className="border rounded px-3 py-1 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => handleDateRangeChange({ ...dateRange, to: e.target.value })}
                className="border rounded px-3 py-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Customer Info - Print Header */}
        <div className="hidden print:block mb-8">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold">Customer Statement</h1>
            <p className="text-gray-600 mt-2">
              {format(new Date(statement.dateRange.from), 'dd MMM yyyy')} - {format(new Date(statement.dateRange.to), 'dd MMM yyyy')}
            </p>
          </div>
          
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-2">Customer Details</h2>
            <div className="text-sm space-y-1">
              <p><strong>{statement.customer.name}</strong></p>
              {statement.customer.email && <p>Email: {statement.customer.email}</p>}
              {statement.customer.phone && <p>Phone: {statement.customer.phone}</p>}
              {statement.customer.address && (
                <p>
                  Address: {statement.customer.address}
                  {statement.customer.city && `, ${statement.customer.city}`}
                  {statement.customer.dzongkhag && `, ${statement.customer.dzongkhag}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Info Card - Screen only */}
        <Card className="mb-6 print:hidden">
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Name:</strong> {statement.customer.name}</p>
                {statement.customer.email && (
                  <p><strong>Email:</strong> {statement.customer.email}</p>
                )}
                {statement.customer.phone && (
                  <p><strong>Phone:</strong> {statement.customer.phone}</p>
                )}
              </div>
              <div>
                {statement.customer.address && (
                  <p>
                    <strong>Address:</strong><br />
                    {statement.customer.address}
                    {statement.customer.city && <><br />{statement.customer.city}</>}
                    {statement.customer.dzongkhag && <>, {statement.customer.dzongkhag}</>}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Opening Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(statement.openingBalance)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Total Invoiced</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(statement.summary.totalInvoiced)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(statement.summary.totalPaid)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-lg font-semibold ${
                parseFloat(statement.summary.totalOutstanding) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(statement.summary.totalOutstanding)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-left py-2">Reference</th>
                    <th className="text-right py-2">Debit</th>
                    <th className="text-right py-2">Credit</th>
                    <th className="text-right py-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance Row */}
                  <tr className="border-b bg-gray-50">
                    <td className="py-2">{format(new Date(statement.dateRange.from), 'dd MMM yyyy')}</td>
                    <td className="py-2">Opening Balance</td>
                    <td className="py-2">-</td>
                    <td className="py-2 text-right">-</td>
                    <td className="py-2 text-right">-</td>
                    <td className="py-2 text-right font-semibold">
                      {formatCurrency(statement.openingBalance)}
                    </td>
                  </tr>
                  
                  {transactions.map((transaction, index) => (
                    <tr key={`${transaction.type}-${transaction.reference}-${index}`} className="border-b">
                      <td className="py-2">
                        {format(new Date(transaction.date), 'dd MMM yyyy')}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          {transaction.description}
                          {transaction.type === 'invoice' && (
                            <div className="print:hidden">
                              {getStatusBadge(
                                (transaction.data as Invoice).status,
                                (transaction.data as Invoice).paymentStatus
                              )}
                            </div>
                          )}
                        </div>
                        {transaction.type === 'payment' && (transaction.data as Payment).allocations.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Applied to: {(transaction.data as Payment).allocations.map(alloc => alloc.invoiceNumber).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-2">{transaction.reference}</td>
                      <td className="py-2 text-right text-red-600">
                        {transaction.debit ? formatCurrency(transaction.debit) : '-'}
                      </td>
                      <td className="py-2 text-right text-green-600">
                        {transaction.credit ? formatCurrency(transaction.credit) : '-'}
                      </td>
                      <td className="py-2 text-right font-semibold">
                        {formatCurrency(transaction.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No transactions found for this date range.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </>
  );
}