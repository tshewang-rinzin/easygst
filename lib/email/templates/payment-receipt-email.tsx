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

interface PaymentReceiptEmailProps {
  businessName: string;
  customerName: string;
  receiptNumber: string;
  paymentDate: string;
  invoiceNumber: string;
  paymentAmount: string;
  paymentMethod: string;
  currency: string;
  referenceNumber?: string;
  viewUrl?: string;
}

export const PaymentReceiptEmail = ({
  businessName = 'Your Business',
  customerName = 'Valued Customer',
  receiptNumber = 'REC-2026-0001',
  paymentDate = 'January 10, 2026',
  invoiceNumber = 'INV-2026-0001',
  paymentAmount = 'BTN 15,000.00',
  paymentMethod = 'Bank Transfer',
  currency = 'BTN',
  referenceNumber,
  viewUrl,
}: PaymentReceiptEmailProps) => {
  const previewText = `Payment receipt ${receiptNumber} from ${businessName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>{businessName}</Heading>
            <Text style={headerText}>Payment Receipt</Text>
          </Section>

          {/* Success Message */}
          <Section style={successSection}>
            <div style={successIcon}>✓</div>
            <Heading style={successHeading}>Payment Received</Heading>
            <Text style={successText}>
              Thank you! Your payment has been successfully received and recorded.
            </Text>
          </Section>

          {/* Receipt Details */}
          <Section style={receiptDetails}>
            <Row>
              <Column style={leftColumn}>
                <Text style={label}>Receipt Number:</Text>
                <Text style={value}>{receiptNumber}</Text>
              </Column>
              <Column style={rightColumn}>
                <Text style={label}>Payment Date:</Text>
                <Text style={value}>{paymentDate}</Text>
              </Column>
            </Row>
            <Row style={{ marginTop: '16px' }}>
              <Column style={leftColumn}>
                <Text style={label}>Invoice Number:</Text>
                <Text style={value}>{invoiceNumber}</Text>
              </Column>
              <Column style={rightColumn}>
                <Text style={label}>Payment Method:</Text>
                <Text style={value}>{paymentMethod}</Text>
              </Column>
            </Row>
            {referenceNumber && (
              <Row style={{ marginTop: '16px' }}>
                <Column>
                  <Text style={label}>Reference Number:</Text>
                  <Text style={value}>{referenceNumber}</Text>
                </Column>
              </Row>
            )}
          </Section>

          <Hr style={hr} />

          {/* Payment Amount */}
          <Section style={amountSection}>
            <Text style={amountLabel}>Amount Paid</Text>
            <Text style={amountValue}>{paymentAmount}</Text>
          </Section>

          {/* View Receipt Button */}
          {viewUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={viewUrl}>
                View Receipt
              </Button>
            </Section>
          )}

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              This receipt confirms your payment. Please keep it for your records.
            </Text>
            <Text style={footerText}>
              If you have any questions about this payment, please contact us.
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

export default PaymentReceiptEmail;

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
  backgroundColor: '#10b981',
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

const successSection = {
  padding: '40px 40px 24px',
  textAlign: 'center' as const,
};

const successIcon = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '36px',
  fontWeight: 'bold',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
};

const successHeading = {
  color: '#32325d',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '16px 0 8px',
};

const successText = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
};

const receiptDetails = {
  padding: '24px 40px',
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  margin: '24px 40px',
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

const amountSection = {
  padding: '24px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  margin: '24px 40px',
};

const amountLabel = {
  color: '#8898aa',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
};

const amountValue = {
  color: '#10b981',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
};

const buttonSection = {
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#10b981',
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
