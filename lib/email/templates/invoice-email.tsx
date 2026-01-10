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

interface InvoiceEmailProps {
  businessName: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  currency: string;
  items: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
  }>;
  subtotal: string;
  totalTax: string;
  viewUrl?: string;
  paymentInstructions?: string;
}

export const InvoiceEmail = ({
  businessName = 'Your Business',
  customerName = 'Valued Customer',
  invoiceNumber = 'INV-2026-0001',
  invoiceDate = 'January 10, 2026',
  dueDate = 'January 24, 2026',
  totalAmount = 'BTN 15,000.00',
  currency = 'BTN',
  items = [],
  subtotal = 'BTN 10,000.00',
  totalTax = 'BTN 5,000.00',
  viewUrl,
  paymentInstructions,
}: InvoiceEmailProps) => {
  const previewText = `Invoice ${invoiceNumber} from ${businessName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>{businessName}</Heading>
            <Text style={headerText}>Tax Invoice</Text>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Text style={text}>Dear {customerName},</Text>
            <Text style={text}>
              Thank you for your business. Please find your invoice details below.
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
                <Text style={label}>Total Amount:</Text>
                <Text style={{ ...value, fontWeight: 'bold', fontSize: '18px', color: '#f97316' }}>
                  {totalAmount}
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Items Table */}
          {items.length > 0 && (
            <Section style={section}>
              <Text style={tableHeader}>Invoice Items</Text>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={tableHeaderCell}>Description</th>
                    <th style={tableHeaderCell}>Qty</th>
                    <th style={tableHeaderCell}>Unit Price</th>
                    <th style={tableHeaderCell}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td style={tableCell}>{item.description}</td>
                      <td style={tableCellCenter}>{item.quantity}</td>
                      <td style={tableCellRight}>{item.unitPrice}</td>
                      <td style={tableCellRight}>{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Totals */}
          <Section style={totalsSection}>
            <Row>
              <Column style={totalsLabel}>
                <Text style={text}>Subtotal:</Text>
              </Column>
              <Column style={totalsValue}>
                <Text style={text}>{subtotal}</Text>
              </Column>
            </Row>
            <Row>
              <Column style={totalsLabel}>
                <Text style={text}>GST (50%):</Text>
              </Column>
              <Column style={totalsValue}>
                <Text style={text}>{totalTax}</Text>
              </Column>
            </Row>
            <Hr style={hr} />
            <Row>
              <Column style={totalsLabel}>
                <Text style={{ ...text, fontWeight: 'bold' }}>Total Amount:</Text>
              </Column>
              <Column style={totalsValue}>
                <Text style={{ ...text, fontWeight: 'bold', fontSize: '18px', color: '#f97316' }}>
                  {totalAmount}
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

export default InvoiceEmail;

// Styles
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

const tableCellCenter = {
  ...tableCell,
  textAlign: 'center' as const,
};

const tableCellRight = {
  ...tableCell,
  textAlign: 'right' as const,
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
