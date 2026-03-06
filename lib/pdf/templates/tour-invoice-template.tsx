import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

export interface TourInvoiceTemplateData {
  // Business Info
  businessName: string;
  logoUrl?: string | null;
  tpn?: string | null;
  gstNumber?: string | null;
  licenseNumber?: string | null;
  address?: string | null;
  city?: string | null;
  dzongkhag?: string | null;
  bankAccounts?: Array<{
    id: string;
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

  // Tour Details
  tourName: string;
  tourType: string;
  arrivalDate?: Date | null;
  departureDate?: Date | null;
  numberOfNights?: number | null;
  numberOfGuests: number;
  guestNationality: string;
  tourGuide?: string | null;

  // Guests
  guests: Array<{
    guestName: string;
    nationality: string;
    passportNumber?: string | null;
    visaNumber?: string | null;
  }>;

  // Items grouped by category
  items: Array<{
    category: string;
    description: string;
    quantity: string;
    unit?: string | null;
    unitPrice: string;
    taxRate: string;
    taxAmount: string;
    isTaxExempt: boolean;
    itemTotal: string;
  }>;

  // SDF
  sdfPerPersonPerNight: string;
  sdfTotal: string;
  sdfBreakdown?: Array<{
    nationality: string;
    count: number;
    ratePerNight: number;
    nights: number;
    subtotal: number;
    isExempt: boolean;
  }>;

  // Inclusions/Exclusions
  inclusions: string[];
  exclusions: string[];

  // Totals
  subtotal: string;
  totalDiscount: string;
  totalTax: string;
  grandTotal: string;
  amountPaid: string;
  amountDue: string;

  // Notes
  paymentTerms?: string | null;
  customerNotes?: string | null;
  termsAndConditions?: string | null;

  // QR Code
  qrCodeDataUrl?: string | null;
}

interface TourInvoiceTemplateProps {
  data: TourInvoiceTemplateData;
  accentColor?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  accommodation: 'Accommodation',
  domestic_flight: 'Domestic Flights',
  international_flight: 'International Flights',
  transport: 'Transport',
  guide: 'Guide',
  meals: 'Meals',
  permits: 'Permits & Entry Fees',
  activities: 'Activities',
  visa: 'Visa',
  miscellaneous: 'Miscellaneous',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingBottom: 15,
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
    fontSize: 28,
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
  twoColumnSection: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  column: {
    flex: 1,
  },
  columnBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 4,
    minHeight: 100,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
  },
  detailText: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 2,
    lineHeight: 1.4,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
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
  // Guest table
  guestSection: {
    marginBottom: 15,
  },
  guestTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guestTable: {
    marginBottom: 10,
  },
  guestHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    padding: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  guestRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1px solid #f3f4f6',
  },
  guestCell: {
    fontSize: 8,
    color: '#374151',
  },
  guestHeaderCell: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  guestCol1: { width: '8%' },
  guestCol2: { width: '30%' },
  guestCol3: { width: '22%' },
  guestCol4: { width: '20%' },
  guestCol5: { width: '20%' },
  // Category items
  categoryHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#374151',
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    padding: 8,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #e5e7eb',
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
  categorySubtotalRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
  },
  // SDF Section
  sdfSection: {
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    borderLeft: '4px solid #3b82f6',
  },
  sdfTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  sdfText: {
    fontSize: 9,
    color: '#1e3a5f',
  },
  // Inclusions/Exclusions
  inclusionSection: {
    marginBottom: 12,
  },
  inclusionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  exclusionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 8,
    color: '#4b5563',
    marginBottom: 2,
  },
  // Totals
  totalsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsSection: {
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
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
  paidBadge: { color: '#16a34a' },
  dueBadge: { color: '#dc2626' },
  // Payment Info
  paymentSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    borderLeft: '4px solid #f59e0b',
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 6,
  },
  paymentText: {
    fontSize: 9,
    color: '#78350f',
    marginBottom: 3,
  },
  // Notes
  notesSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
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
    paddingTop: 12,
    borderTop: '1px solid #e5e7eb',
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 2,
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
});

export const TourInvoiceTemplate: React.FC<TourInvoiceTemplateProps> = ({ data, accentColor }) => {
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

  const isDraft = data.status === 'draft';

  // Group items by category
  const itemsByCategory: Record<string, typeof data.items> = {};
  data.items.forEach((item) => {
    if (!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
    itemsByCategory[item.category].push(item);
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {isDraft && <Text style={styles.watermark}>DRAFT</Text>}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>TOUR INVOICE</Text>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
            {!isDraft && (
              <View style={styles.originalBadge}>
                <Text style={styles.originalBadgeText}>ORIGINAL</Text>
              </View>
            )}
          </View>
        </View>

        {/* From / Bill To */}
        <View style={styles.twoColumnSection}>
          <View style={styles.column}>
            <Text style={styles.sectionLabel}>From</Text>
            <View style={styles.columnBox}>
              <Text style={styles.companyName}>{data.businessName}</Text>
              {data.tpn && <Text style={styles.detailText}>TPN: {data.tpn}</Text>}
              {data.gstNumber && <Text style={styles.detailText}>GST: {data.gstNumber}</Text>}
              {data.licenseNumber && <Text style={styles.detailText}>License: {data.licenseNumber}</Text>}
              {data.address && <Text style={styles.detailText}>{data.address}</Text>}
              {(data.city || data.dzongkhag) && (
                <Text style={styles.detailText}>
                  {[data.city, data.dzongkhag].filter(Boolean).join(', ')}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <View style={styles.columnBox}>
              <Text style={styles.companyName}>{data.customer.name}</Text>
              {data.customer.tpn && <Text style={styles.detailText}>TPN: {data.customer.tpn}</Text>}
              {data.customer.email && <Text style={styles.detailText}>{data.customer.email}</Text>}
              {data.customer.phone && <Text style={styles.detailText}>{data.customer.phone}</Text>}
              {data.customer.address && <Text style={styles.detailText}>{data.customer.address}</Text>}
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

        {/* Tour Details */}
        <View style={styles.twoColumnSection}>
          <View style={styles.column}>
            <Text style={styles.sectionLabel}>Tour Details</Text>
            <View style={styles.columnBox}>
              <Text style={styles.detailText}>Tour: {data.tourName}</Text>
              <Text style={styles.detailText}>Type: {data.tourType.charAt(0).toUpperCase() + data.tourType.slice(1)}</Text>
              <Text style={styles.detailText}>Arrival: {formatDate(data.arrivalDate)}</Text>
              <Text style={styles.detailText}>Departure: {formatDate(data.departureDate)}</Text>
              <Text style={styles.detailText}>Nights: {data.numberOfNights ?? '-'}</Text>
            </View>
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionLabel}>Guest Details</Text>
            <View style={styles.columnBox}>
              <Text style={styles.detailText}>Number of Guests: {data.numberOfGuests}</Text>
              <Text style={styles.detailText}>Nationality: {data.guestNationality}</Text>
              {data.tourGuide && <Text style={styles.detailText}>Tour Guide: {data.tourGuide}</Text>}
              <Text style={styles.detailText}>Currency: {data.currency}</Text>
            </View>
          </View>
        </View>

        {/* Guest Information Table */}
        {data.guests.length > 0 && (
          <View style={styles.guestSection}>
            <Text style={styles.guestTitle}>Guest Information</Text>
            <View style={styles.guestTable}>
              <View style={styles.guestHeaderRow}>
                <Text style={[styles.guestHeaderCell, styles.guestCol1]}>#</Text>
                <Text style={[styles.guestHeaderCell, styles.guestCol2]}>Name</Text>
                <Text style={[styles.guestHeaderCell, styles.guestCol3]}>Nationality</Text>
                <Text style={[styles.guestHeaderCell, styles.guestCol4]}>Passport</Text>
                <Text style={[styles.guestHeaderCell, styles.guestCol5]}>Visa</Text>
              </View>
              {data.guests.map((guest, i) => (
                <View key={i} style={styles.guestRow}>
                  <Text style={[styles.guestCell, styles.guestCol1]}>{i + 1}</Text>
                  <Text style={[styles.guestCell, styles.guestCol2]}>{guest.guestName}</Text>
                  <Text style={[styles.guestCell, styles.guestCol3]}>{guest.nationality}</Text>
                  <Text style={[styles.guestCell, styles.guestCol4]}>{guest.passportNumber || '-'}</Text>
                  <Text style={[styles.guestCell, styles.guestCol5]}>{guest.visaNumber || '-'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Line Items by Category */}
        {Object.entries(itemsByCategory).map(([category, catItems]) => {
          const categoryTotal = catItems.reduce((sum, item) => sum + parseFloat(item.itemTotal), 0);
          return (
            <View key={category} wrap={false}>
              <Text style={styles.categoryHeader}>
                {CATEGORY_LABELS[category] || category}
              </Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
                <Text style={[styles.tableHeaderText, styles.col3]}>Rate</Text>
                <Text style={[styles.tableHeaderText, styles.col4]}>Tax</Text>
                <Text style={[styles.tableHeaderText, styles.col5]}>Tax Amt</Text>
                <Text style={[styles.tableHeaderText, styles.col6]}>Amount</Text>
              </View>
              {catItems.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <Text style={[styles.tableCell, styles.col1]}>{item.description}</Text>
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
              ))}
              <View style={styles.categorySubtotalRow}>
                <Text style={[styles.tableCell, styles.col1, { fontWeight: 'bold', color: '#6b7280' }]}>
                  Category Total
                </Text>
                <Text style={[styles.tableCell, { width: '65%', textAlign: 'right', fontWeight: 'bold' }]}>
                  {formatCurrency(categoryTotal.toFixed(2), data.currency)}
                </Text>
              </View>
            </View>
          );
        })}

        {/* SDF Section */}
        {parseFloat(data.sdfTotal) > 0 && (
          <View style={styles.sdfSection}>
            <Text style={styles.sdfTitle}>SUSTAINABLE DEVELOPMENT FEE (SDF)</Text>
            {data.sdfBreakdown && data.sdfBreakdown.length > 1 ? (
              <>
                {data.sdfBreakdown.map((b, i) => (
                  <Text key={i} style={styles.sdfText}>
                    {b.count} × {b.nationality} × {b.nights} night{b.nights !== 1 ? 's' : ''} × USD {b.ratePerNight.toFixed(2)} = USD {b.subtotal.toFixed(2)}{b.isExempt ? ' (exempt)' : ''}
                  </Text>
                ))}
                <Text style={[styles.sdfText, { fontWeight: 'bold', marginTop: 4 }]}>
                  Total SDF: USD {parseFloat(data.sdfTotal).toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={styles.sdfText}>
                {data.numberOfGuests} guest{data.numberOfGuests !== 1 ? 's' : ''} × {data.numberOfNights ?? 0} night{(data.numberOfNights ?? 0) !== 1 ? 's' : ''} × USD {parseFloat(data.sdfPerPersonPerNight).toFixed(2)} = USD {parseFloat(data.sdfTotal).toFixed(2)}
              </Text>
            )}
          </View>
        )}
        {/* SDF Exempt notice */}
        {parseFloat(data.sdfTotal) === 0 && data.sdfBreakdown && data.sdfBreakdown.length > 0 && data.sdfBreakdown.every(b => b.isExempt) && (
          <View style={[styles.sdfSection, { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' }]}>
            <Text style={[styles.sdfTitle, { color: '#166534' }]}>SUSTAINABLE DEVELOPMENT FEE (SDF)</Text>
            <Text style={[styles.sdfText, { color: '#15803d' }]}>All guests are SDF exempt</Text>
          </View>
        )}

        {/* Inclusions & Exclusions */}
        {(data.inclusions.length > 0 || data.exclusions.length > 0) && (
          <View style={[styles.twoColumnSection, { marginTop: 10 }]}>
            {data.inclusions.length > 0 && (
              <View style={[styles.column, styles.inclusionSection]}>
                <Text style={styles.inclusionTitle}>✓ Inclusions</Text>
                {data.inclusions.map((item, i) => (
                  <Text key={i} style={styles.bulletText}>• {item}</Text>
                ))}
              </View>
            )}
            {data.exclusions.length > 0 && (
              <View style={[styles.column, styles.inclusionSection]}>
                <Text style={styles.exclusionTitle}>✗ Exclusions</Text>
                {data.exclusions.map((item, i) => (
                  <Text key={i} style={styles.bulletText}>• {item}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsWrapper}>
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.subtotal, data.currency)}</Text>
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
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.totalTax, data.currency)}</Text>
            </View>
            {parseFloat(data.sdfTotal) > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#1e40af' }]}>SDF</Text>
                <Text style={[styles.totalValue, { color: '#1e40af' }]}>
                  USD {parseFloat(data.sdfTotal).toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(data.grandTotal, data.currency)}</Text>
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
                  <Text style={[styles.totalLabel, styles.dueBadge, { fontWeight: 'bold' }]}>Balance Due</Text>
                  <Text style={[styles.totalValue, styles.dueBadge]}>
                    {formatCurrency(data.amountDue, data.currency)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment Info */}
        {(data.paymentTerms || (data.bankAccounts && data.bankAccounts.length > 0)) && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>PAYMENT INFORMATION</Text>
            {data.paymentTerms && <Text style={styles.paymentText}>{data.paymentTerms}</Text>}
            {data.bankAccounts && data.bankAccounts.length > 0 && (
              data.bankAccounts.map((account, index) => (
                <View key={account.id} style={{ marginTop: index > 0 ? 6 : 4 }}>
                  <Text style={[styles.paymentText, { fontWeight: 'bold' }]}>
                    {account.paymentMethod === 'mbob'
                      ? 'mBoB'
                      : account.paymentMethod === 'mpay'
                        ? 'mPay'
                        : account.paymentMethod === 'bank_transfer'
                          ? 'Bank Transfer'
                          : account.paymentMethod.charAt(0).toUpperCase() + account.paymentMethod.slice(1)}
                  </Text>
                  <Text style={styles.paymentText}>
                    {account.bankName} - {account.accountNumber}
                  </Text>
                  <Text style={[styles.paymentText, { fontSize: 8 }]}>
                    A/c Name: {account.accountName}
                  </Text>
                </View>
              ))
            )}
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
          <View style={styles.footerLeft}>
            {data.termsAndConditions && (
              <Text style={styles.footerText}>{data.termsAndConditions}</Text>
            )}
            <Text style={styles.footerText}>This is a computer-generated tour invoice.</Text>
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
