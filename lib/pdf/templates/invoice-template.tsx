import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: '#555',
    marginBottom: 2,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    objectFit: 'contain',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 4,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: '#000',
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '2px solid #d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #e5e7eb',
  },
  tableCell: {
    fontSize: 9,
  },
  col1: { width: '35%' },
  col2: { width: '10%', textAlign: 'right' },
  col3: { width: '10%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  col6: { width: '15%', textAlign: 'right' },
  totalsSection: {
    marginLeft: 'auto',
    width: '40%',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 4,
    fontSize: 10,
  },
  totalLabel: {
    color: '#666',
  },
  totalValue: {
    fontWeight: 'bold',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#f9fafb',
    marginTop: 4,
    borderTop: '2px solid #d1d5db',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ea580c',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: 8,
    color: '#666',
    marginBottom: 4,
  },
  signature: {
    marginTop: 40,
    paddingTop: 20,
  },
  signatureLine: {
    borderTop: '1px solid #000',
    width: 200,
    marginTop: 40,
  },
  signatureLabel: {
    fontSize: 9,
    marginTop: 4,
  },
  watermark: {
    position: 'absolute',
    fontSize: 60,
    color: '#f3f4f6',
    transform: 'rotate(-45deg)',
    top: '40%',
    left: '25%',
    opacity: 0.1,
  },
});

interface InvoiceData {
  // Business Info
  businessName: string;
  logoUrl?: string | null;
  tpn?: string | null;
  gstNumber?: string | null;
  licenseNumber?: string | null;
  address?: string | null;
  city?: string | null;
  dzongkhag?: string | null;
  // Legacy bank fields (deprecated)
  bankName?: string | null;
  bankAccountNumber?: string | null;
  // Bank Accounts (new)
  bankAccounts?: Array<{
    id: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    paymentMethod: string;
    isDefault: boolean;
  }>;

  // Invoice Info
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date | null;
  status: string;
  currency: string;

  // Customer Info
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    tpn?: string | null;
  };

  // Line Items
  items: Array<{
    description: string;
    quantity: string;
    unit?: string | null;
    unitPrice: string;
    taxRate: string;
    taxAmount: string;
    isTaxExempt: boolean;
    gstClassification?: string | null;
    itemTotal: string;
  }>;

  // Totals
  subtotal: string;
  totalDiscount: string;
  totalTax: string;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;

  // Notes
  paymentTerms?: string | null;
  customerNotes?: string | null;
  termsAndConditions?: string | null;
}

export const InvoiceTemplate: React.FC<{ data: InvoiceData }> = ({ data }) => {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
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
        {/* Watermark for Draft */}
        {data.status === 'draft' && (
          <Text style={styles.watermark}>DRAFT</Text>
        )}

        {/* Header - Business & Invoice Info */}
        <View style={styles.header}>
          <View style={styles.row}>
            {/* Business Info */}
            <View style={styles.column}>
              {data.logoUrl && (
                <Image src={data.logoUrl} style={styles.logo} />
              )}
              <Text style={styles.companyName}>{data.businessName}</Text>
              {data.tpn && (
                <Text style={styles.companyDetails}>TPN: {data.tpn}</Text>
              )}
              {data.gstNumber && (
                <Text style={styles.companyDetails}>GST: {data.gstNumber}</Text>
              )}
              {data.licenseNumber && (
                <Text style={styles.companyDetails}>
                  License: {data.licenseNumber}
                </Text>
              )}
              {data.address && (
                <Text style={styles.companyDetails}>{data.address}</Text>
              )}
              {data.city && data.dzongkhag && (
                <Text style={styles.companyDetails}>
                  {data.city}, {data.dzongkhag}
                </Text>
              )}
            </View>

            {/* Invoice Header */}
            <View style={[styles.column, { alignItems: 'flex-end' }]}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
              <Text style={styles.label}>
                Date: {formatDate(data.invoiceDate)}
              </Text>
              {data.dueDate && (
                <Text style={styles.label}>
                  Due: {formatDate(data.dueDate)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BILL TO</Text>
          <Text style={styles.value}>{data.customer.name}</Text>
          {data.customer.tpn && (
            <Text style={styles.label}>TPN: {data.customer.tpn}</Text>
          )}
          {data.customer.email && (
            <Text style={styles.label}>{data.customer.email}</Text>
          )}
          {data.customer.phone && (
            <Text style={styles.label}>{data.customer.phone}</Text>
          )}
          {data.customer.address && (
            <Text style={styles.label}>{data.customer.address}</Text>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.col1]}>Description</Text>
            <Text style={[styles.tableCell, styles.col2]}>Qty</Text>
            <Text style={[styles.tableCell, styles.col3]}>Unit Price</Text>
            <Text style={[styles.tableCell, styles.col4]}>Tax Rate</Text>
            <Text style={[styles.tableCell, styles.col5]}>Tax Amount</Text>
            <Text style={[styles.tableCell, styles.col6]}>Total</Text>
          </View>

          {/* Table Rows */}
          {data.items.map((item, index) => {
            const classification = item.gstClassification || 'STANDARD';
            const classificationColors: Record<string, string> = {
              STANDARD: '#3b82f6',
              ZERO_RATED: '#16a34a',
              EXEMPT: '#6b7280',
            };

            return (
              <View key={index} style={styles.tableRow}>
                <View style={styles.col1}>
                  <Text style={styles.tableCell}>{item.description}</Text>
                  <Text style={[styles.tableCell, { fontSize: 7, color: classificationColors[classification] || '#6b7280', marginTop: 2 }]}>
                    {classification === 'ZERO_RATED' ? 'Zero-Rated' : classification === 'EXEMPT' ? 'Exempt' : 'Standard'}
                  </Text>
                </View>
                <Text style={[styles.tableCell, styles.col2]}>
                  {parseFloat(item.quantity).toFixed(2)} {item.unit || ''}
                </Text>
                <Text style={[styles.tableCell, styles.col3]}>
                  {formatCurrency(item.unitPrice, data.currency)}
                </Text>
                <Text style={[styles.tableCell, styles.col4]}>
                  {item.isTaxExempt ? '-' : `${parseFloat(item.taxRate).toFixed(0)}%`}
                </Text>
                <Text style={[styles.tableCell, styles.col5]}>
                  {formatCurrency(item.taxAmount || '0', data.currency)}
                </Text>
                <Text style={[styles.tableCell, styles.col6]}>
                  {formatCurrency(item.itemTotal, data.currency)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(data.subtotal, data.currency)}
            </Text>
          </View>

          {parseFloat(data.totalDiscount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#16a34a' }]}>
                Discount:
              </Text>
              <Text style={[styles.totalValue, { color: '#16a34a' }]}>
                -{formatCurrency(data.totalDiscount, data.currency)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Tax (GST):</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(data.totalTax, data.currency)}
            </Text>
          </View>

          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total Amount:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(data.totalAmount, data.currency)}
            </Text>
          </View>

          {parseFloat(data.amountPaid) > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#16a34a' }]}>
                  Amount Paid:
                </Text>
                <Text style={[styles.totalValue, { color: '#16a34a' }]}>
                  -{formatCurrency(data.amountPaid, data.currency)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#dc2626' }]}>
                  Amount Due:
                </Text>
                <Text style={[styles.totalValue, { color: '#dc2626' }]}>
                  {formatCurrency(data.amountDue, data.currency)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Payment Info */}
        {(data.paymentTerms || data.bankAccounts?.length || data.bankName) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
            {data.paymentTerms && (
              <Text style={styles.value}>{data.paymentTerms}</Text>
            )}

            {/* Display new bank accounts if available */}
            {data.bankAccounts && data.bankAccounts.length > 0 ? (
              <View style={{ marginTop: 8 }}>
                {data.bankAccounts.map((account, index) => (
                  <View key={account.id} style={{ marginBottom: index < data.bankAccounts!.length - 1 ? 8 : 0 }}>
                    <Text style={styles.label}>
                      {account.paymentMethod === 'mbob' ? 'mBoB' :
                       account.paymentMethod === 'mpay' ? 'mPay' :
                       account.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                       account.paymentMethod.charAt(0).toUpperCase() + account.paymentMethod.slice(1)}
                      {account.isDefault && ' (Default)'}
                    </Text>
                    <Text style={styles.label}>
                      {account.bankName} - {account.accountNumber}
                    </Text>
                    <Text style={[styles.label, { fontSize: 7 }]}>
                      A/c Name: {account.accountName}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              /* Fallback to legacy bank fields */
              data.bankName && (
                <>
                  <Text style={styles.label}>Bank: {data.bankName}</Text>
                  {data.bankAccountNumber && (
                    <Text style={styles.label}>
                      Account: {data.bankAccountNumber}
                    </Text>
                  )}
                </>
              )
            )}
          </View>
        )}

        {/* Customer Notes */}
        {data.customerNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <Text style={styles.value}>{data.customerNotes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {data.termsAndConditions && (
            <Text style={styles.footerText}>{data.termsAndConditions}</Text>
          )}
          <Text style={styles.footerText}>
            This is a computer-generated invoice. For queries, please contact us.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Authorized Signature</Text>
        </View>
      </Page>
    </Document>
  );
};
