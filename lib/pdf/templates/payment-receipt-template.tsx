import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottom: '2pt solid #f97316',
    paddingBottom: 10,
  },
  logoSection: {
    width: '25%',
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  titleSection: {
    width: '75%',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  section: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  column: {
    width: '48%',
  },
  label: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 9,
    color: '#111827',
    fontWeight: 'bold',
  },
  businessInfo: {
    marginBottom: 2,
    fontSize: 8,
    color: '#374151',
  },
  receiptNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  amountBox: {
    backgroundColor: '#f0fdf4',
    border: '1pt solid #22c55e',
    borderRadius: 4,
    padding: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 9,
    color: '#15803d',
    marginBottom: 3,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803d',
  },
  table: {
    marginTop: 8,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 5,
    borderBottom: '1pt solid #d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottom: '0.5pt solid #e5e7eb',
  },
  tableCol1: {
    width: '40%',
  },
  tableCol2: {
    width: '20%',
    textAlign: 'right',
  },
  tableCol3: {
    width: '20%',
    textAlign: 'right',
  },
  tableCol4: {
    width: '20%',
    textAlign: 'right',
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  tableCellText: {
    fontSize: 8,
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
  },
  totalValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
  },
  footer: {
    marginTop: 15,
    paddingTop: 10,
    borderTop: '1pt solid #e5e7eb',
    fontSize: 7,
    color: '#6b7280',
    textAlign: 'center',
  },
  notesBox: {
    backgroundColor: '#fef9c3',
    padding: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#854d0e',
    marginBottom: 3,
  },
  notesText: {
    fontSize: 8,
    color: '#713f12',
    lineHeight: 1.3,
  },
});

interface PaymentReceiptProps {
  payment: {
    id: string;
    receiptNumber: string;
    amount: string;
    allocatedAmount: string;
    unallocatedAmount: string;
    currency: string;
    paymentDate: string;
    paymentMethod: string;
    paymentMethodName?: string;
    paymentGateway?: string;
    transactionId?: string;
    bankName?: string;
    chequeNumber?: string;
    notes?: string;
    createdAt: string;
    customer?: {
      name: string;
      email?: string;
      phone?: string;
      mobile?: string;
      address?: string;
      city?: string;
      dzongkhag?: string;
      tpn?: string;
    };
    allocations?: Array<{
      id: string;
      allocatedAmount: string;
      invoice?: {
        invoiceNumber: string;
        invoiceDate: string;
        totalAmount: string;
        currency: string;
      };
    }>;
  };
  team: {
    name: string;
    businessName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    dzongkhag?: string;
    postalCode?: string;
    tpn?: string;
    gstNumber?: string;
    logoUrl?: string;
  };
}

export const PaymentReceiptDocument = ({ payment, team }: PaymentReceiptProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string, currency: string) => {
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo */}
        <View style={styles.header}>
          {team.logoUrl && (
            <View style={styles.logoSection}>
              <Image src={team.logoUrl} style={styles.logo} />
            </View>
          )}
          <View style={styles.titleSection}>
            <Text style={styles.title}>PAYMENT RECEIPT</Text>
            <Text style={styles.subtitle}>Official Payment Acknowledgment</Text>
          </View>
        </View>

        {/* Business & Receipt Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>From</Text>
              <Text style={styles.value}>{team.businessName || team.name}</Text>
              {team.address && <Text style={styles.businessInfo}>{team.address}</Text>}
              {(team.city || team.dzongkhag) && (
                <Text style={styles.businessInfo}>
                  {[team.city, team.dzongkhag].filter(Boolean).join(', ')}
                  {team.postalCode && ` - ${team.postalCode}`}
                </Text>
              )}
              {team.phone && <Text style={styles.businessInfo}>Ph: {team.phone}</Text>}
              {team.email && <Text style={styles.businessInfo}>{team.email}</Text>}
              {team.tpn && <Text style={styles.businessInfo}>TPN: {team.tpn}</Text>}
            </View>

            <View style={styles.column}>
              <Text style={styles.receiptNumber}>{payment.receiptNumber}</Text>
              <View style={{ marginBottom: 4 }}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{formatDate(payment.paymentDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Info - Condensed */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Received From</Text>
              <Text style={styles.value}>{payment.customer?.name || 'N/A'}</Text>
              {payment.customer?.mobile && (
                <Text style={styles.businessInfo}>Ph: {payment.customer.mobile}</Text>
              )}
              {payment.customer?.tpn && (
                <Text style={styles.businessInfo}>TPN: {payment.customer.tpn}</Text>
              )}
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Payment Method</Text>
              <Text style={styles.value}>{payment.paymentMethodName || payment.paymentMethod}</Text>
              {payment.transactionId && (
                <Text style={styles.businessInfo}>Txn: {payment.transactionId}</Text>
              )}
              {payment.chequeNumber && (
                <Text style={styles.businessInfo}>Cheque: {payment.chequeNumber}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Amount Box */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>AMOUNT RECEIVED</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(payment.amount, payment.currency)}
          </Text>
        </View>

        {/* Invoice Allocations */}
        {payment.allocations && payment.allocations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Applied To Invoices</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.tableCol1]}>
                  Invoice Number
                </Text>
                <Text style={[styles.tableHeaderText, styles.tableCol2]}>
                  Invoice Date
                </Text>
                <Text style={[styles.tableHeaderText, styles.tableCol3]}>
                  Invoice Total
                </Text>
                <Text style={[styles.tableHeaderText, styles.tableCol4]}>
                  Amount Applied
                </Text>
              </View>
              {payment.allocations.map((allocation) => (
                <View key={allocation.id} style={styles.tableRow}>
                  <Text style={[styles.tableCellText, styles.tableCol1]}>
                    {allocation.invoice?.invoiceNumber || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCellText, styles.tableCol2]}>
                    {allocation.invoice?.invoiceDate
                      ? formatDate(allocation.invoice.invoiceDate)
                      : 'N/A'}
                  </Text>
                  <Text style={[styles.tableCellText, styles.tableCol3]}>
                    {allocation.invoice
                      ? formatCurrency(
                          allocation.invoice.totalAmount,
                          allocation.invoice.currency
                        )
                      : 'N/A'}
                  </Text>
                  <Text style={[styles.tableCellText, styles.tableCol4]}>
                    {formatCurrency(allocation.allocatedAmount, payment.currency)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Allocated</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(payment.allocatedAmount, payment.currency)}
              </Text>
            </View>

            {parseFloat(payment.unallocatedAmount) > 0 && (
              <View style={[styles.totalRow, { backgroundColor: '#fef3c7', marginTop: 5 }]}>
                <Text style={styles.totalLabel}>Unallocated (Credit Balance)</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(payment.unallocatedAmount, payment.currency)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {payment.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{payment.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Computer-generated receipt. No signature required.</Text>
          <Text style={{ marginTop: 3 }}>
            Generated: {new Date().toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
