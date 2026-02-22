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

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2px solid #1f2937',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
    objectFit: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 4,
  },
  originalBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  originalBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#16a34a',
    letterSpacing: 1,
  },
  // Two Column Section for From/To
  twoColumnSection: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 30,
  },
  column: {
    flex: 1,
  },
  columnBox: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 4,
    minHeight: 120,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 3,
    lineHeight: 1.4,
  },
  detailLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  // Invoice Meta (Date, Due Date)
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
    gap: 30,
  },
  metaItem: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  // Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  col1: { width: '35%' },
  col2: { width: '10%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '12%', textAlign: 'right' },
  col5: { width: '13%', textAlign: 'right' },
  col6: { width: '15%', textAlign: 'right' },
  gstTag: {
    fontSize: 7,
    marginTop: 3,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  // Totals Section
  totalsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsSection: {
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#1f2937',
    borderRadius: 4,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Payment Info
  paymentSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    borderLeft: '4px solid #f59e0b',
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 9,
    color: '#78350f',
    marginBottom: 4,
  },
  // Notes Section
  notesSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 15,
    borderTop: '1px solid #e5e7eb',
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 3,
  },
  signatureSection: {
    alignItems: 'center',
    marginRight: 30,
  },
  signatureLine: {
    borderTop: '1px solid #374151',
    width: 150,
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  qrSection: {
    alignItems: 'center',
  },
  qrCode: {
    width: 70,
    height: 70,
  },
  qrLabel: {
    fontSize: 7,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  // Watermark
  watermark: {
    position: 'absolute',
    fontSize: 72,
    color: '#e5e7eb',
    transform: 'rotate(-45deg)',
    top: '40%',
    left: '15%',
    opacity: 0.3,
    fontWeight: 'bold',
    letterSpacing: 10,
  },
  // Paid/Due badges in totals
  paidBadge: {
    color: '#16a34a',
  },
  dueBadge: {
    color: '#dc2626',
  },
});

import { InvoiceData, InvoiceTemplateProps } from './types';

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ data, accentColor }) => {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return `${currency} ${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getGstTagStyle = (classification: string) => {
    switch (classification) {
      case 'ZERO_RATED':
        return { backgroundColor: '#dcfce7', color: '#16a34a' };
      case 'EXEMPT':
        return { backgroundColor: '#f3f4f6', color: '#6b7280' };
      default:
        return { backgroundColor: '#dbeafe', color: '#2563eb' };
    }
  };

  const getGstLabel = (classification: string) => {
    switch (classification) {
      case 'ZERO_RATED':
        return 'Zero-Rated';
      case 'EXEMPT':
        return 'Exempt';
      default:
        return 'Standard';
    }
  };

  const isDraft = data.status === 'draft';
  const isPaid = parseFloat(data.amountDue) <= 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark for Draft */}
        {isDraft && <Text style={styles.watermark}>DRAFT</Text>}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.logoUrl && (
              <Image src={data.logoUrl} style={styles.logo} />
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
            {!isDraft && (
              <View style={styles.originalBadge}>
                <Text style={styles.originalBadgeText}>ORIGINAL</Text>
              </View>
            )}
          </View>
        </View>

        {/* Two Column: From / Bill To */}
        <View style={styles.twoColumnSection}>
          {/* From (Billing Company) */}
          <View style={styles.column}>
            <Text style={styles.sectionLabel}>From</Text>
            <View style={styles.columnBox}>
              <Text style={styles.companyName}>{data.businessName}</Text>
              {data.tpn && (
                <Text style={styles.detailText}>TPN: {data.tpn}</Text>
              )}
              {data.gstNumber && (
                <Text style={styles.detailText}>GST: {data.gstNumber}</Text>
              )}
              {data.licenseNumber && (
                <Text style={styles.detailText}>License: {data.licenseNumber}</Text>
              )}
              {data.address && (
                <Text style={styles.detailText}>{data.address}</Text>
              )}
              {(data.city || data.dzongkhag) && (
                <Text style={styles.detailText}>
                  {[data.city, data.dzongkhag].filter(Boolean).join(', ')}
                </Text>
              )}
            </View>
          </View>

          {/* Bill To (Customer) */}
          <View style={styles.column}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <View style={styles.columnBox}>
              <Text style={styles.companyName}>{data.customer.name}</Text>
              {data.customer.tpn && (
                <Text style={styles.detailText}>TPN: {data.customer.tpn}</Text>
              )}
              {data.customer.email && (
                <Text style={styles.detailText}>{data.customer.email}</Text>
              )}
              {data.customer.phone && (
                <Text style={styles.detailText}>{data.customer.phone}</Text>
              )}
              {data.customer.address && (
                <Text style={styles.detailText}>{data.customer.address}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Invoice Meta */}
        <View style={styles.metaSection}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Invoice Date</Text>
            <Text style={styles.metaValue}>{formatDate(data.invoiceDate)}</Text>
          </View>
          {data.dueDate && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>{formatDate(data.dueDate)}</Text>
            </View>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Tax</Text>
            <Text style={[styles.tableHeaderText, styles.col5]}>Tax Amt</Text>
            <Text style={[styles.tableHeaderText, styles.col6]}>Total</Text>
          </View>

          {/* Table Rows */}
          {data.items.map((item, index) => {
            const classification = item.gstClassification || 'STANDARD';
            const gstStyle = getGstTagStyle(classification);

            return (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowAlt : {},
                ]}
              >
                <View style={styles.col1}>
                  <Text style={styles.tableCell}>{item.description}</Text>
                  <View style={[styles.gstTag, gstStyle]}>
                    <Text style={{ fontSize: 6, color: gstStyle.color }}>
                      {getGstLabel(classification)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.tableCell, styles.col2]}>
                  {parseFloat(item.quantity).toFixed(2)}
                  {item.unit ? ` ${item.unit}` : ''}
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
                <Text style={[styles.tableCell, styles.col6, { fontWeight: 'bold' }]}>
                  {formatCurrency(item.itemTotal, data.currency)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsWrapper}>
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(data.subtotal, data.currency)}
              </Text>
            </View>

            {parseFloat(data.totalDiscount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, styles.paidBadge]}>Discount</Text>
                <Text style={[styles.totalValue, styles.paidBadge]}>
                  -{formatCurrency(data.totalDiscount, data.currency)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(data.totalTax, data.currency)}
              </Text>
            </View>

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Amount</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(data.totalAmount, data.currency)}
              </Text>
            </View>

            {parseFloat(data.amountPaid) > 0 && (
              <>
                <View style={[styles.totalRow, { marginTop: 8 }]}>
                  <Text style={[styles.totalLabel, styles.paidBadge]}>Amount Paid</Text>
                  <Text style={[styles.totalValue, styles.paidBadge]}>
                    -{formatCurrency(data.amountPaid, data.currency)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, styles.dueBadge, { fontWeight: 'bold' }]}>
                    Balance Due
                  </Text>
                  <Text style={[styles.totalValue, styles.dueBadge]}>
                    {formatCurrency(data.amountDue, data.currency)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment Info */}
        {(data.paymentTerms || data.bankAccounts?.length || data.bankName) && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>PAYMENT INFORMATION</Text>
            {data.paymentTerms && (
              <Text style={styles.paymentText}>{data.paymentTerms}</Text>
            )}

            {data.bankAccounts && data.bankAccounts.length > 0 ? (
              data.bankAccounts.map((account, index) => (
                <View key={account.id} style={{ marginTop: index > 0 ? 6 : 4 }}>
                  <Text style={[styles.paymentText, { fontWeight: 'bold' }]}>
                    {account.paymentMethod === 'mbob'
                      ? 'mBoB'
                      : account.paymentMethod === 'mpay'
                        ? 'mPay'
                        : account.paymentMethod === 'bank_transfer'
                          ? 'Bank Transfer'
                          : account.paymentMethod.charAt(0).toUpperCase() +
                            account.paymentMethod.slice(1)}
                    {account.isDefault ? ' (Default)' : ''}
                  </Text>
                  <Text style={styles.paymentText}>
                    {account.bankName} - {account.accountNumber}
                  </Text>
                  <Text style={[styles.paymentText, { fontSize: 8 }]}>
                    A/c Name: {account.accountName}
                  </Text>
                </View>
              ))
            ) : (
              data.bankName && (
                <>
                  <Text style={styles.paymentText}>Bank: {data.bankName}</Text>
                  {data.bankAccountNumber && (
                    <Text style={styles.paymentText}>
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
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{data.customerNotes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {data.termsAndConditions && (
              <Text style={styles.footerText}>{data.termsAndConditions}</Text>
            )}
            <Text style={styles.footerText}>
              This is a computer-generated invoice.
            </Text>
          </View>

          <View style={styles.signatureSection}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
          </View>

          {data.qrCodeDataUrl && (
            <View style={styles.qrSection}>
              <Image src={data.qrCodeDataUrl} style={styles.qrCode} />
              <Text style={styles.qrLabel}>Scan to verify</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};
