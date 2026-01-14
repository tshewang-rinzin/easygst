import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  name?: string;
  resetUrl: string;
  expiryHours?: number;
}

export const PasswordResetEmail = ({
  name,
  resetUrl,
  expiryHours = 1,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your password for EasyGST</Preview>
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
            Password Reset Request
          </Heading>
          <Text style={{ color: '#525f7f', fontSize: '16px', lineHeight: '24px' }}>
            {name ? `Hi ${name},` : 'Hello,'}
          </Text>
          <Text style={{ color: '#525f7f', fontSize: '16px', lineHeight: '24px', marginTop: '16px' }}>
            We received a request to reset your password for your EasyGST account.
            Click the button below to create a new password.
          </Text>
        </Section>

        <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
          <table role="presentation" cellSpacing="0" cellPadding="0" style={{ margin: '0 auto' }}>
            <tr>
              <td>
                <a
                  href={resetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#f97316',
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
                  Reset Password
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
              href={resetUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#f97316',
                fontSize: '14px',
                wordBreak: 'break-all' as const,
              }}
            >
              {resetUrl}
            </a>
          </Text>
        </Section>

        <Section style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e6ebf1' }}>
          <Text style={{ color: '#8898aa', fontSize: '13px', lineHeight: '20px' }}>
            <strong>Important:</strong> This password reset link will expire in {expiryHours} hour{expiryHours > 1 ? 's' : ''}.
            If you didn't request a password reset, you can safely ignore this email.
            Your password will remain unchanged.
          </Text>
        </Section>

        <Section style={{ marginTop: '32px' }}>
          <Text style={{ color: '#8898aa', fontSize: '12px', textAlign: 'center' as const }}>
            &copy; {new Date().getFullYear()} EasyGST. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;
