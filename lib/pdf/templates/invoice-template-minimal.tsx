import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { InvoiceTemplateProps } from './types';

const createStyles = (accent: string) =>
  StyleSheet.create({
    page: {
      padding: 50,
      fontSize: 10,
      fontFamily: 'Helvetica',
      backgroundColor: '#ffffff',
    },
    watermark: {
      position: 'absolute',
      top: '40%',
      left: '20%',
      fontSize: 80,
      color: '#f3f4f6',
      fontWeight: 'bold',
      transform: 'rotate(-30deg)',
      opacity: 0.5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 40,
    },
    logo: {
      width: 45,
      height: 45,
      marginBottom: 8,
      objectFit: 'contain',
    },
    businessName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 4,
    },
    businessDetail: {
      fontSize: 8,
      color: '#9ca3af',
      marginBottom: 1,
    },
    invoiceTitle: {
      fontSize: 24,
      color: '#111827',
      fontWeight: 'bold',
      letterSpacing: 3,
    },
    invoiceNumber: {
      fontSize: 10,
      color: '#9ca3af',
      marginTop: 4,
      textAlign: 'right',
    },
    invoiceDate: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 2,
      textAlign: 'right',
    },
    divider: {
      borderBottomWidth: 0.5,
      borderBottomColor: '#e5e7eb',
      marginBottom: 24,
    },
    twoCol: {
      flexDirection: 'row',
      gap: 40,
      marginBottom: 32,
    },
    col: {
      flex: 1,
    },
    sectionLabel: {
      fontSize: 7,
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: 8,
    },
    name: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 4,
    },
    detailText: {
      fontSize: 9,
      color: '#6b7280',
      marginBottom: 2,
      lineHeight: 1.5,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 32,
      marginBottom: 24,
    },
    metaLabel: {
      fontSize: 7,
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 2,
    },
    metaValue: {
      fontSize: 10,
      color: '#111827',
    },
    table: {
      marginBottom: 24,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingBottom: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: '#d1d5db',
    },
    tableHeaderText: {
      fontSize: 7,
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: '#f3f4f6',
    },
    tableCell: {
      fontSize: 9,
      color: '#374151',
    },
    col1: { flex: 3 },
    col2: { flex: 1, textAlign: 'center' },
    col3: { flex: 1.5, textAlign: 'right' },
    col4: { flex: 0.8, textAlign: 'center' },
    col5: { flex: 1.2, textAlign: 'right' },
    col6: { flex: 1.5, textAlign: 'right' },
    gstTag: {
      paddingVertical: 1,
      paddingHorizontal: 4,
      borderRadius: 2,
      marginTop: 2,
      alignSelf: 'flex-start',
    },
    totalsWrapper: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 24,
    },
    totals: {
      width: 200,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    totalLabel: {
      fontSize: 9,
      color: '#9ca3af',
    },
    totalValue: {
      fontSize: 9,
      color: '#374151',
    },
    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 10,
      marginTop: 6,
      borderTopWidth: 0.5,
      borderTopColor: '#d1d5db',
    },
    grandTotalLabel: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#111827',
    },
    grandTotalValue: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#111827',
    },
    paymentSection: {
      marginBottom: 16,
      paddingTop: 16,
      borderTopWidth: 0.5,
      borderTopColor: '#e5e7eb',
    },
    paymentTitle: {
      fontSize: 7,
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: 6,
    },
    paymentText: {
      fontSize: 9,
      color: '#6b7280',
      marginBottom: 2,
    },
    notesSection: {
      marginBottom: 16,
    },
    notesTitle: {
      fontSize: 7,
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: 4,
    },
    notesText: {
      fontSize: 9,
      color: '#6b7280',
      lineHeight: 1.5,
    },
    footer: {
      marginTop: 'auto',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingTop: 16,
    },
    footerText: {
      fontSize: 7,
      color: '#d1d5db',
    },
    signatureSection: {
      alignItems: 'center',
    },
    signatureLine: {
      width: 100,
      borderBottomWidth: 0.5,
      borderBottomColor: '#e5e7eb',
      marginBottom: 4,
    },
    signatureLabel: {
      fontSize: 7,
      color: '#d1d5db',
    },
    qrSection: {
      alignItems: 'center',
    },
    qrCode: {
      width: 50,
      height: 50,
    },
    qrLabel: {
      fontSize: 6,
      color: '#d1d5db',
      marginTop: 2,
    },
    paidBadge: { color: '#16a34a' },
    dueBadge: { color: '#dc2626' },
  });

export const InvoiceTemplateMinimal: React.FC<InvoiceTemplateProps> = ({
  data,
  accentColor = '#111827',
}) => {
  const styles = createStyles(accentColor);

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
      case 'ZERO_RATED': return { backgroundColor: '#dcfce7', color: '#16a34a' };
      case 'EXEMPT': return { backgroundColor: '#f3f4f6', color: '#6b7280' };
      default: return { backgroundColor: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getGstLabel = (classification: string) => {
    switch (classification) {
      case 'ZERO_RATED': return 'Zero-Rated';
      case 'EXEMPT': return 'Exempt';
      default: return 'Standard';
    }
  };

  const isDraft = data.status === 'draft';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {isDraft && <Text style={styles.watermark}>DRAFT</Text>}

        {/* Header */}
        <View style={styles.header}>
          <View>
            {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
            <Text style={styles.businessName}>{data.businessName}</Text>
            {data.tpn && <Text style={styles.businessDetail}>TPN: {data.tpn}</Text>}
            {data.address && <Text style={styles.businessDetail}>{data.address}</Text>}
            {(data.city || data.dzongkhag) && (
              <Text style={styles.businessDetail}>{[data.city, data.dzongkhag].filter(Boolean).join(', ')}</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>{formatDate(data.invoiceDate)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* From / Bill To */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>From</Text>
            <Text style={styles.name}>{data.businessName}</Text>
            {data.gstNumber && <Text style={styles.detailText}>GST: {data.gstNumber}</Text>}
            {data.licenseNumber && <Text style={styles.detailText}>License: {data.licenseNumber}</Text>}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.name}>{data.customer.name}</Text>
            {data.customer.tpn && <Text style={styles.detailText}>TPN: {data.customer.tpn}</Text>}
            {data.customer.email && <Text style={styles.detailText}>{data.customer.email}</Text>}
            {data.customer.phone && <Text style={styles.detailText}>{data.customer.phone}</Text>}
            {data.customer.address && <Text style={styles.detailText}>{data.customer.address}</Text>}
          </View>
        </View>

        {/* Meta */}
        {data.dueDate && (
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>{formatDate(data.dueDate)}</Text>
            </View>
          </View>
        )}

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Tax</Text>
            <Text style={[styles.tableHeaderText, styles.col5]}>Tax Amt</Text>
            <Text style={[styles.tableHeaderText, styles.col6]}>Total</Text>
          </View>
          {data.items.map((item, index) => {
            const classification = item.gstClassification || 'STANDARD';
            const gstStyle = getGstTagStyle(classification);
            return (
              <View key={index} style={styles.tableRow}>
                <View style={styles.col1}>
                  <Text style={styles.tableCell}>{item.description}</Text>
                  <View style={[styles.gstTag, gstStyle]}>
                    <Text style={{ fontSize: 6, color: gstStyle.color }}>{getGstLabel(classification)}</Text>
                  </View>
                </View>
                <Text style={[styles.tableCell, styles.col2]}>
                  {parseFloat(item.quantity).toFixed(2)}{item.unit ? ` ${item.unit}` : ''}
                </Text>
                <Text style={[styles.tableCell, styles.col3]}>{formatCurrency(item.unitPrice, data.currency)}</Text>
                <Text style={[styles.tableCell, styles.col4]}>{item.isTaxExempt ? '-' : `${parseFloat(item.taxRate).toFixed(0)}%`}</Text>
                <Text style={[styles.tableCell, styles.col5]}>{formatCurrency(item.taxAmount || '0', data.currency)}</Text>
                <Text style={[styles.tableCell, styles.col6, { fontWeight: 'bold' }]}>{formatCurrency(item.itemTotal, data.currency)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsWrapper}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.subtotal, data.currency)}</Text>
            </View>
            {parseFloat(data.totalDiscount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, styles.paidBadge]}>Discount</Text>
                <Text style={[styles.totalValue, styles.paidBadge]}>-{formatCurrency(data.totalDiscount, data.currency)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.totalTax, data.currency)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(data.totalAmount, data.currency)}</Text>
            </View>
            {parseFloat(data.amountPaid) > 0 && (
              <>
                <View style={[styles.totalRow, { marginTop: 8 }]}>
                  <Text style={[styles.totalLabel, styles.paidBadge]}>Paid</Text>
                  <Text style={[styles.totalValue, styles.paidBadge]}>-{formatCurrency(data.amountPaid, data.currency)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, styles.dueBadge, { fontWeight: 'bold' }]}>Due</Text>
                  <Text style={[styles.totalValue, styles.dueBadge]}>{formatCurrency(data.amountDue, data.currency)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment Info */}
        {(data.paymentTerms || data.bankAccounts?.length || data.bankName) && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Payment</Text>
            {data.paymentTerms && <Text style={styles.paymentText}>{data.paymentTerms}</Text>}
            {data.bankAccounts && data.bankAccounts.length > 0 ? (
              data.bankAccounts.map((account, index) => (
                <View key={account.id} style={{ marginTop: index > 0 ? 6 : 4 }}>
                  <Text style={[styles.paymentText, { fontWeight: 'bold' }]}>
                    {account.paymentMethod === 'mbob' ? 'mBoB' : account.paymentMethod === 'mpay' ? 'mPay' : account.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : account.paymentMethod.charAt(0).toUpperCase() + account.paymentMethod.slice(1)}
                    {account.isDefault ? ' (Default)' : ''}
                  </Text>
                  <Text style={styles.paymentText}>{account.bankName} - {account.accountNumber}</Text>
                </View>
              ))
            ) : data.bankName ? (
              <>
                <Text style={styles.paymentText}>Bank: {data.bankName}</Text>
                {data.bankAccountNumber && <Text style={styles.paymentText}>Account: {data.bankAccountNumber}</Text>}
              </>
            ) : null}
          </View>
        )}

        {/* Notes */}
        {data.customerNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{data.customerNotes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            {data.termsAndConditions && <Text style={styles.footerText}>{data.termsAndConditions}</Text>}
            <Text style={styles.footerText}>Computer-generated invoice</Text>
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
