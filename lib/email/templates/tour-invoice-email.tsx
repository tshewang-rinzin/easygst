import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface TourInvoiceEmailProps {
  businessName: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  tourName: string;
  arrivalDate: string;
  departureDate: string;
  numberOfNights: number;
  numberOfGuests: number;
  guestNationality: string;
  currency: string;
  categoryTotals: Array<{
    category: string;
    total: string;
  }>;
  sdfTotal: string;
  grandTotal: string;
  viewUrl?: string;
  paymentInstructions?: string;
}

export const TourInvoiceEmail = ({
  businessName = 'Your Business',
  customerName = 'Valued Customer',
  invoiceNumber = 'TI-2026-0001',
  invoiceDate = 'March 15, 2026',
  dueDate = 'April 15, 2026',
  tourName = 'Cultural Tour',
  arrivalDate = 'March 20, 2026',
  departureDate = 'March 27, 2026',
  numberOfNights = 7,
  numberOfGuests = 2,
  guestNationality = 'American',
  currency = 'USD',
  categoryTotals = [],
  sdfTotal = '0.00',
  grandTotal = 'USD 0.00',
  viewUrl,
  paymentInstructions,
}: TourInvoiceEmailProps) => {
  const previewText = `Tour Invoice ${invoiceNumber} from ${businessName} - ${tourName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>{businessName}</Heading>
            <Text style={headerText}>Tour Invoice</Text>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Text style={text}>Dear {customerName},</Text>
            <Text style={text}>
              Thank you for choosing us for your tour. Please find your tour invoice details below.
            </Text>
          </Section>

          {/* Invoice Details */}
          <Section style={invoiceDetails}>
            <Row>
              <Column style={leftColumn}>
                <Text style={label}>Invoice Number:</Text>
                <Text style={value}>{invoiceNumber}</Text>
              </Column>
              <Column style={rightColumn}>
                <Text style={label}>Invoice Date:</Text>
                <Text style={value}>{invoiceDate}</Text>
              </Column>
            </Row>
            <Row style={{ marginTop: '12px' }}>
              <Column style={leftColumn}>
                <Text style={label}>Due Date:</Text>
                <Text style={value}>{dueDate}</Text>
              </Column>
              <Column style={rightColumn}>
                <Text style={label}>Tour Name:</Text>
                <Text style={value}>{tourName}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Tour Details */}
          <Section style={section}>
            <Text style={tableHeader}>Tour Details</Text>
            <table style={table}>
              <tbody>
                <tr>
                  <td style={detailLabelCell}>Arrival:</td>
                  <td style={detailValueCell}>{arrivalDate}</td>
                  <td style={detailLabelCell}>Departure:</td>
                  <td style={detailValueCell}>{departureDate}</td>
                </tr>
                <tr>
                  <td style={detailLabelCell}>Nights:</td>
                  <td style={detailValueCell}>{numberOfNights}</td>
                  <td style={detailLabelCell}>Guests:</td>
                  <td style={detailValueCell}>{numberOfGuests}</td>
                </tr>
                <tr>
                  <td style={detailLabelCell}>Nationality:</td>
                  <td style={detailValueCell} colSpan={3}>{guestNationality}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={hr} />

          {/* Category Totals */}
          {categoryTotals.length > 0 && (
            <Section style={section}>
              <Text style={tableHeader}>Cost Summary</Text>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={tableHeaderCell}>Category</th>
                    <th style={{ ...tableHeaderCell, textAlign: 'right' as const }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTotals.map((cat, index) => (
                    <tr key={index}>
                      <td style={tableCell}>{cat.category}</td>
                      <td style={tableCellRight}>{cat.total}</td>
                    </tr>
                  ))}
                  {parseFloat(sdfTotal) > 0 && (
                    <tr>
                      <td style={{ ...tableCell, fontWeight: '600', color: '#1e40af' }}>
                        Sustainable Development Fee (SDF)
                      </td>
                      <td style={{ ...tableCellRight, fontWeight: '600', color: '#1e40af' }}>
                        USD {sdfTotal}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>
          )}

          {/* Grand Total */}
          <Section style={totalsSection}>
            <Hr style={hr} />
            <Row>
              <Column style={totalsLabel}>
                <Text style={{ ...text, fontWeight: 'bold' }}>Grand Total:</Text>
              </Column>
              <Column style={totalsValue}>
                <Text style={{ ...text, fontWeight: 'bold', fontSize: '18px', color: '#f97316' }}>
                  {grandTotal}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Payment Instructions */}
          {paymentInstructions && (
            <Section style={section}>
              <Text style={label}>Payment Instructions:</Text>
              <Text style={text}>{paymentInstructions}</Text>
            </Section>
          )}

          {/* View Invoice Button */}
          {viewUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={viewUrl}>
                View Invoice
              </Button>
            </Section>
          )}

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Thank you for your business. If you have any questions, please contact us.
            </Text>
            <Text style={footerText}>
              This is an automated email from EasyGST. Please do not reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TourInvoiceEmail;

// Styles (same as invoice-email.tsx)
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#f97316',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const headerText = {
  color: '#ffffff',
  fontSize: '14px',
  margin: '8px 0 0',
};

const section = {
  padding: '0 40px',
  marginTop: '24px',
};

const text = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 12px',
};

const label = {
  color: '#8898aa',
  fontSize: '12px',
  fontWeight: '600',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
};

const value = {
  color: '#32325d',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const invoiceDetails = {
  padding: '24px 40px',
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  margin: '24px 40px',
};

const leftColumn = {
  width: '50%',
  paddingRight: '12px',
};

const rightColumn = {
  width: '50%',
  paddingLeft: '12px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const tableHeader = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#32325d',
  marginBottom: '12px',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tableHeaderCell = {
  padding: '12px 8px',
  borderBottom: '2px solid #e6ebf1',
  fontSize: '12px',
  fontWeight: '600',
  color: '#8898aa',
  textAlign: 'left' as const,
  textTransform: 'uppercase' as const,
};

const tableCell = {
  padding: '12px 8px',
  borderBottom: '1px solid #f6f9fc',
  fontSize: '14px',
  color: '#525f7f',
};

const tableCellRight = {
  ...tableCell,
  textAlign: 'right' as const,
};

const detailLabelCell = {
  padding: '6px 8px',
  fontSize: '12px',
  fontWeight: '600',
  color: '#8898aa',
  width: '25%',
};

const detailValueCell = {
  padding: '6px 8px',
  fontSize: '14px',
  color: '#32325d',
  width: '25%',
};

const totalsSection = {
  padding: '0 40px',
  marginTop: '24px',
};

const totalsLabel = {
  width: '70%',
  textAlign: 'right' as const,
  paddingRight: '12px',
};

const totalsValue = {
  width: '30%',
  textAlign: 'right' as const,
};

const buttonSection = {
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#f97316',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  padding: '0 40px',
  marginTop: '24px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};
