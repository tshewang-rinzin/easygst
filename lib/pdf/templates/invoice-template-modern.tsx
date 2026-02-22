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
      padding: 0,
      fontSize: 10,
      fontFamily: 'Helvetica',
      backgroundColor: '#ffffff',
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 8,
      backgroundColor: accent,
    },
    content: {
      paddingLeft: 40,
      paddingRight: 40,
      paddingTop: 40,
      paddingBottom: 30,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 30,
    },
    logo: {
      width: 50,
      height: 50,
      marginRight: 12,
      objectFit: 'contain',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    businessName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#111827',
    },
    businessDetail: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 2,
    },
    invoiceTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: accent,
      letterSpacing: 1,
    },
    invoiceNumber: {
      fontSize: 11,
      color: '#6b7280',
      marginTop: 4,
      textAlign: 'right',
    },
    badge: {
      marginTop: 6,
      paddingVertical: 3,
      paddingHorizontal: 10,
      backgroundColor: accent + '20',
      borderRadius: 12,
      alignSelf: 'flex-end',
    },
    badgeText: {
      fontSize: 8,
      fontWeight: 'bold',
      color: accent,
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
    twoCol: {
      flexDirection: 'row',
      gap: 24,
      marginBottom: 24,
    },
    col: {
      flex: 1,
    },
    infoBox: {
      backgroundColor: '#f9fafb',
      padding: 14,
      borderRadius: 8,
      minHeight: 100,
    },
    sectionLabel: {
      fontSize: 7,
      fontWeight: 'bold',
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 8,
    },
    companyName: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 4,
    },
    detailText: {
      fontSize: 9,
      color: '#4b5563',
      marginBottom: 2,
      lineHeight: 1.4,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 24,
      marginBottom: 20,
    },
    metaItem: {
      alignItems: 'flex-end',
    },
    metaLabel: {
      fontSize: 7,
      color: '#9ca3af',
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    metaValue: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#111827',
    },
    table: {
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: accent,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 6,
    },
    tableHeaderText: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#ffffff',
      textTransform: 'uppercase',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
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
      borderRadius: 3,
      marginTop: 2,
      alignSelf: 'flex-start',
    },
    totalsWrapper: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 20,
    },
    totals: {
      width: 220,
      backgroundColor: '#f9fafb',
      padding: 14,
      borderRadius: 8,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    totalLabel: {
      fontSize: 9,
      color: '#6b7280',
    },
    totalValue: {
      fontSize: 9,
      color: '#374151',
    },
    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
      marginTop: 8,
      borderTopWidth: 2,
      borderTopColor: accent,
    },
    grandTotalLabel: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#111827',
    },
    grandTotalValue: {
      fontSize: 11,
      fontWeight: 'bold',
      color: accent,
    },
    paymentSection: {
      backgroundColor: '#f9fafb',
      padding: 14,
      borderRadius: 8,
      marginBottom: 16,
    },
    paymentTitle: {
      fontSize: 8,
      fontWeight: 'bold',
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6,
    },
    paymentText: {
      fontSize: 9,
      color: '#4b5563',
      marginBottom: 2,
    },
    notesSection: {
      marginBottom: 16,
    },
    notesTitle: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#6b7280',
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    notesText: {
      fontSize: 9,
      color: '#4b5563',
      lineHeight: 1.4,
    },
    footer: {
      marginTop: 'auto',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
    },
    footerText: {
      fontSize: 7,
      color: '#9ca3af',
    },
    signatureSection: {
      alignItems: 'center',
    },
    signatureLine: {
      width: 120,
      borderBottomWidth: 1,
      borderBottomColor: '#d1d5db',
      marginBottom: 4,
    },
    signatureLabel: {
      fontSize: 7,
      color: '#9ca3af',
    },
    qrSection: {
      alignItems: 'center',
    },
    qrCode: {
      width: 60,
      height: 60,
    },
    qrLabel: {
      fontSize: 6,
      color: '#9ca3af',
      marginTop: 2,
    },
    paidBadge: { color: '#16a34a' },
    dueBadge: { color: '#dc2626' },
  });

export const InvoiceTemplateModern: React.FC<InvoiceTemplateProps> = ({
  data,
  accentColor = '#2563eb',
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
      case 'ZERO_RATED': return 'Zero-Rated';
      case 'EXEMPT': return 'Exempt';
      default: return 'Standard';
    }
  };

  const isDraft = data.status === 'draft';
  const isPaid = parseFloat(data.amountDue) <= 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />
        {isDraft && <Text style={styles.watermark}>DRAFT</Text>}

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
              <View>
                <Text style={styles.businessName}>{data.businessName}</Text>
                {data.tpn && <Text style={styles.businessDetail}>TPN: {data.tpn}</Text>}
                {data.gstNumber && <Text style={styles.businessDetail}>GST: {data.gstNumber}</Text>}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
              {!isDraft && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>ORIGINAL</Text>
                </View>
              )}
            </View>
          </View>

          {/* From / Bill To */}
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.sectionLabel}>From</Text>
              <View style={styles.infoBox}>
                <Text style={styles.companyName}>{data.businessName}</Text>
                {data.licenseNumber && <Text style={styles.detailText}>License: {data.licenseNumber}</Text>}
                {data.address && <Text style={styles.detailText}>{data.address}</Text>}
                {(data.city || data.dzongkhag) && (
                  <Text style={styles.detailText}>{[data.city, data.dzongkhag].filter(Boolean).join(', ')}</Text>
                )}
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.sectionLabel}>Bill To</Text>
              <View style={styles.infoBox}>
                <Text style={styles.companyName}>{data.customer.name}</Text>
                {data.customer.tpn && <Text style={styles.detailText}>TPN: {data.customer.tpn}</Text>}
                {data.customer.email && <Text style={styles.detailText}>{data.customer.email}</Text>}
                {data.customer.phone && <Text style={styles.detailText}>{data.customer.phone}</Text>}
                {data.customer.address && <Text style={styles.detailText}>{data.customer.address}</Text>}
              </View>
            </View>
          </View>

          {/* Meta */}
          <View style={styles.metaRow}>
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
                <Text style={styles.grandTotalLabel}>Total Amount</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(data.totalAmount, data.currency)}</Text>
              </View>
              {parseFloat(data.amountPaid) > 0 && (
                <>
                  <View style={[styles.totalRow, { marginTop: 8 }]}>
                    <Text style={[styles.totalLabel, styles.paidBadge]}>Amount Paid</Text>
                    <Text style={[styles.totalValue, styles.paidBadge]}>-{formatCurrency(data.amountPaid, data.currency)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, styles.dueBadge, { fontWeight: 'bold' }]}>Balance Due</Text>
                    <Text style={[styles.totalValue, styles.dueBadge]}>{formatCurrency(data.amountDue, data.currency)}</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Payment Info */}
          {(data.paymentTerms || data.bankAccounts?.length || data.bankName) && (
            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Payment Information</Text>
              {data.paymentTerms && <Text style={styles.paymentText}>{data.paymentTerms}</Text>}
              {data.bankAccounts && data.bankAccounts.length > 0 ? (
                data.bankAccounts.map((account, index) => (
                  <View key={account.id} style={{ marginTop: index > 0 ? 6 : 4 }}>
                    <Text style={[styles.paymentText, { fontWeight: 'bold' }]}>
                      {account.paymentMethod === 'mbob' ? 'mBoB' : account.paymentMethod === 'mpay' ? 'mPay' : account.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : account.paymentMethod.charAt(0).toUpperCase() + account.paymentMethod.slice(1)}
                      {account.isDefault ? ' (Default)' : ''}
                    </Text>
                    <Text style={styles.paymentText}>{account.bankName} - {account.accountNumber}</Text>
                    <Text style={[styles.paymentText, { fontSize: 8 }]}>A/c Name: {account.accountName}</Text>
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
              <Text style={styles.footerText}>This is a computer-generated invoice.</Text>
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
        </View>
      </Page>
    </Document>
  );
};
