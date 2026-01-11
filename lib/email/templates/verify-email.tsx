import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerifyEmailProps {
  name?: string;
  verificationUrl: string;
  expiryHours?: number;
}

export const VerifyEmail = ({
  name,
  verificationUrl,
  expiryHours = 24,
}: VerifyEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for EasyGST</Preview>
    <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
      <Container
        style={{
          backgroundColor: '#ffffff',
          margin: '0 auto',
          padding: '40px',
          maxWidth: '600px',
          borderRadius: '8px',
        }}
      >
        <Section style={{ textAlign: 'center' as const }}>
          <Heading style={{ color: '#32325d', fontSize: '28px', marginBottom: '16px' }}>
            Welcome to EasyGST!
          </Heading>
          <Text style={{ color: '#525f7f', fontSize: '16px', lineHeight: '24px' }}>
            {name ? `Hi ${name},` : 'Hello,'}
          </Text>
          <Text style={{ color: '#525f7f', fontSize: '16px', lineHeight: '24px', marginTop: '16px' }}>
            Thank you for signing up for EasyGST. To complete your registration and start
            managing your invoices, please verify your email address by clicking the button below.
          </Text>
        </Section>

        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <table role="presentation" cellSpacing="0" cellPadding="0" style={{ margin: '0 auto' }}>
            <tr>
              <td>
                <a
                  href={verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#5469d4',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    textAlign: 'center' as const,
                    display: 'inline-block',
                    padding: '16px 40px',
                    minWidth: '200px',
                  }}
                >
                  Verify Email Address
                </a>
              </td>
            </tr>
          </table>
        </Section>

        <Section style={{ marginTop: '32px' }}>
          <Text style={{ color: '#525f7f', fontSize: '14px', lineHeight: '20px' }}>
            If the button above doesn't work, copy and paste this URL into your browser:
          </Text>
          <Text style={{ marginTop: '8px' }}>
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#5469d4',
                fontSize: '14px',
                wordBreak: 'break-all' as const,
              }}
            >
              {verificationUrl}
            </a>
          </Text>
        </Section>

        <Section style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e6ebf1' }}>
          <Text style={{ color: '#8898aa', fontSize: '13px', lineHeight: '20px' }}>
            <strong>Important:</strong> This verification link will expire in {expiryHours} hours.
            If you didn't create an account with EasyGST, you can safely ignore this email.
          </Text>
        </Section>

        <Section style={{ marginTop: '32px' }}>
          <Text style={{ color: '#8898aa', fontSize: '12px', textAlign: 'center' as const }}>
            © {new Date().getFullYear()} EasyGST. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default VerifyEmail;
