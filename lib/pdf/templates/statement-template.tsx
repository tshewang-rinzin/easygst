import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZs.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfMZs.ttf',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZs.ttf',
      fontWeight: 700,
    },
  ],
});

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  dzongkhag?: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
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
  paymentMethodName?: string | null;
  transactionId?: string | null;
  receiptNumber?: string | null;
  notes?: string | null;
  advanceNumber?: string | null;
  paymentType: string;
  allocations: Array<{
    invoiceNumber: string;
    allocatedAmount: string;
  }>;
}

interface Transaction {
  type: 'invoice' | 'payment';
  date: string;
  description: string;
  reference: string;
  debit?: string;
  credit?: string;
  balance: string;
}

interface BusinessInfo {
  name: string;
  businessName?: string | null;
  address?: string | null;
  city?: string | null;
  dzongkhag?: string | null;
  phone?: string | null;
  email?: string | null;
  tpn?: string | null;
  gstNumber?: string | null;
}

export interface StatementTemplateData {
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
  business: BusinessInfo;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    padding: 40,
    lineHeight: 1.4,
    color: '#374151',
  },
  header: {
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: '1 solid #e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  businessInfo: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 20,
  },
  businessName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 4,
  },
  customerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerInfo: {
    fontSize: 10,
    color: '#4b5563',
  },
  customerName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 4,
  },
  summarySection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    border: '1 solid #e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 600,
  },
  summaryValue: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 600,
  },
  summaryTotal: {
    borderTop: '1 solid #d1d5db',
    paddingTop: 8,
    marginTop: 8,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottom: '1 solid #d1d5db',
    fontWeight: 600,
    fontSize: 9,
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '0.5 solid #e5e7eb',
    fontSize: 9,
  },
  openingBalanceRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f9fafb',
    borderBottom: '1 solid #d1d5db',
    fontSize: 9,
    fontWeight: 600,
  },
  col1: { flex: 1.2 }, // Date
  col2: { flex: 3 },   // Description
  col3: { flex: 1.5 }, // Reference
  col4: { flex: 1.2, textAlign: 'right' }, // Debit
  col5: { flex: 1.2, textAlign: 'right' }, // Credit
  col6: { flex: 1.2, textAlign: 'right', fontWeight: 600 }, // Balance
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '0.5 solid #e5e7eb',
    paddingTop: 10,
  },
});

const formatCurrency = (amount: string) => {
  const num = parseFloat(amount);
  return `Nu. ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function StatementTemplate({ data }: { data: StatementTemplateData }) {
  // Combine invoices and payments into transactions
  const transactions: Transaction[] = [];
  let runningBalance = parseFloat(data.openingBalance);

  // Add invoices as debit transactions
  data.invoices.forEach((invoice) => {
    const amount = parseFloat(invoice.totalAmount);
    runningBalance += amount;
    
    transactions.push({
      type: 'invoice',
      date: invoice.invoiceDate,
      description: `Invoice - ${invoice.invoiceNumber}`,
      reference: invoice.invoiceNumber,
      debit: invoice.totalAmount,
      balance: runningBalance.toFixed(2),
    });
  });

  // Add payments as credit transactions
  data.payments.forEach((payment) => {
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
    });
  });

  // Sort transactions by date (chronological order for statement)
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Customer Statement</Text>
          <Text style={styles.subtitle}>
            {format(new Date(data.dateRange.from), 'dd MMM yyyy')} - {format(new Date(data.dateRange.to), 'dd MMM yyyy')}
          </Text>
        </View>

        {/* Business Information */}
        {data.business && (
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>
              {data.business.businessName || data.business.name}
            </Text>
            {data.business.address && (
              <Text>
                {data.business.address}
                {data.business.city && `, ${data.business.city}`}
                {data.business.dzongkhag && `, ${data.business.dzongkhag}`}
              </Text>
            )}
            {data.business.phone && <Text>Phone: {data.business.phone}</Text>}
            {data.business.email && <Text>Email: {data.business.email}</Text>}
            {data.business.tpn && <Text>TPN: {data.business.tpn}</Text>}
          </View>
        )}

        {/* Customer Information */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{data.customer.name}</Text>
            {data.customer.email && <Text>Email: {data.customer.email}</Text>}
            {data.customer.phone && <Text>Phone: {data.customer.phone}</Text>}
            {data.customer.address && (
              <Text>
                Address: {data.customer.address}
                {data.customer.city && `, ${data.customer.city}`}
                {data.customer.dzongkhag && `, ${data.customer.dzongkhag}`}
              </Text>
            )}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Opening Balance:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.openingBalance)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Invoiced:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.summary.totalInvoiced)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.summary.totalPaid)}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryLabel}>Outstanding Balance:</Text>
            <Text style={[
              styles.summaryValue,
              { color: parseFloat(data.summary.totalOutstanding) > 0 ? '#dc2626' : '#16a34a' }
            ]}>
              {formatCurrency(data.summary.totalOutstanding)}
            </Text>
          </View>
        </View>

        {/* Transaction Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Date</Text>
            <Text style={styles.col2}>Description</Text>
            <Text style={styles.col3}>Reference</Text>
            <Text style={styles.col4}>Debit</Text>
            <Text style={styles.col5}>Credit</Text>
            <Text style={styles.col6}>Balance</Text>
          </View>

          {/* Opening Balance */}
          <View style={styles.openingBalanceRow}>
            <Text style={styles.col1}>{format(new Date(data.dateRange.from), 'dd MMM yyyy')}</Text>
            <Text style={styles.col2}>Opening Balance</Text>
            <Text style={styles.col3}>-</Text>
            <Text style={styles.col4}>-</Text>
            <Text style={styles.col5}>-</Text>
            <Text style={styles.col6}>{formatCurrency(data.openingBalance)}</Text>
          </View>

          {/* Transactions */}
          {transactions.map((transaction, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>
                {format(new Date(transaction.date), 'dd MMM yyyy')}
              </Text>
              <Text style={styles.col2}>{transaction.description}</Text>
              <Text style={styles.col3}>{transaction.reference}</Text>
              <Text style={[styles.col4, { color: transaction.debit ? '#dc2626' : '#000' }]}>
                {transaction.debit ? formatCurrency(transaction.debit) : '-'}
              </Text>
              <Text style={[styles.col5, { color: transaction.credit ? '#16a34a' : '#000' }]}>
                {transaction.credit ? formatCurrency(transaction.credit) : '-'}
              </Text>
              <Text style={styles.col6}>{formatCurrency(transaction.balance)}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This statement was generated on {format(new Date(), 'dd MMM yyyy HH:mm')}
        </Text>
      </Page>
    </Document>
  );
}