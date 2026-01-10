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

interface PaymentReminderEmailProps {
  businessName: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amountDue: string;
  currency: string;
  daysOverdue?: number;
  viewUrl?: string;
  paymentInstructions?: string;
}

export const PaymentReminderEmail = ({
  businessName = 'Your Business',
  customerName = 'Valued Customer',
  invoiceNumber = 'INV-2026-0001',
  invoiceDate = 'January 10, 2026',
  dueDate = 'January 24, 2026',
  amountDue = 'BTN 15,000.00',
  currency = 'BTN',
  daysOverdue = 0,
  viewUrl,
  paymentInstructions,
}: PaymentReminderEmailProps) => {
  const previewText = daysOverdue && daysOverdue > 0
    ? `Payment overdue for invoice ${invoiceNumber}`
    : `Payment reminder for invoice ${invoiceNumber}`;

  const isOverdue = daysOverdue && daysOverdue > 0;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>{businessName}</Heading>
            <Text style={headerText}>Payment Reminder</Text>
          </Section>

          {/* Alert Section */}
          <Section style={isOverdue ? overdueSection : reminderSection}>
            <div style={isOverdue ? overdueIcon : reminderIcon}>!</div>
            <Heading style={alertHeading}>
              {isOverdue ? 'Payment Overdue' : 'Payment Reminder'}
            </Heading>
            <Text style={alertText}>
              {isOverdue
                ? `This invoice is ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue. Please submit payment as soon as possible.`
                : 'This invoice is due soon. Please submit payment by the due date to avoid late fees.'}
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
            <Row style={{ marginTop: '16px' }}>
              <Column style={leftColumn}>
                <Text style={label}>Due Date:</Text>
                <Text style={{...value, color: isOverdue ? '#dc2626' : '#32325d', fontWeight: isOverdue ? 'bold' : '500'}}>
                  {dueDate}
                </Text>
              </Column>
              <Column style={rightColumn}>
                <Text style={label}>Amount Due:</Text>
                <Text style={{...value, fontSize: '18px', fontWeight: 'bold', color: isOverdue ? '#dc2626' : '#f97316'}}>
                  {amountDue}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Payment Instructions */}
          {paymentInstructions && (
            <>
              <Hr style={hr} />
              <Section style={section}>
                <Text style={sectionHeading}>Payment Instructions:</Text>
                <Text style={text}>{paymentInstructions}</Text>
              </Section>
            </>
          )}

          {/* View Invoice Button */}
          {viewUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={viewUrl}>
                View Invoice & Pay
              </Button>
            </Section>
          )}

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              If you have already made this payment, please disregard this reminder.
            </Text>
            <Text style={footerText}>
              For any questions, please contact us at your earliest convenience.
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

export default PaymentReminderEmail;

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
  backgroundColor: '#3b82f6',
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

const reminderSection = {
  padding: '40px 40px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#fef3c7',
  margin: '24px 40px',
  borderRadius: '8px',
};

const overdueSection = {
  padding: '40px 40px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#fee2e2',
  margin: '24px 40px',
  borderRadius: '8px',
};

const reminderIcon = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#f59e0b',
  color: '#ffffff',
  fontSize: '36px',
  fontWeight: 'bold',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
};

const overdueIcon = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  fontSize: '36px',
  fontWeight: 'bold',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
};

const alertHeading = {
  color: '#32325d',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '16px 0 8px',
};

const alertText = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
};

const section = {
  padding: '0 40px',
  marginTop: '24px',
};

const sectionHeading = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#32325d',
  marginBottom: '8px',
};

const text = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
};

const invoiceDetails = {
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

const buttonSection = {
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#3b82f6',
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
