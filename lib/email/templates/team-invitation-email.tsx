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

interface TeamInvitationEmailProps {
  invitedByName?: string;
  invitedByEmail: string;
  teamName: string;
  role: string;
  invitationUrl: string;
  expiryDays?: number;
}

export const TeamInvitationEmail = ({
  invitedByName,
  invitedByEmail,
  teamName,
  role,
  invitationUrl,
  expiryDays = 7,
}: TeamInvitationEmailProps) => {
  const inviterDisplay = invitedByName || invitedByEmail;

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return '#dc2626';
      case 'admin':
        return '#ea580c';
      default:
        return '#0891b2';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {teamName} on EasyGST</Preview>
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
              Team Invitation
            </Heading>
            <Text style={{ color: '#525f7f', fontSize: '16px', lineHeight: '24px' }}>
              {inviterDisplay} has invited you to join
            </Text>
            <Text
              style={{
                color: '#32325d',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '16px 0',
              }}
            >
              {teamName}
            </Text>
            <div style={{ marginTop: '16px' }}>
              <span
                style={{
                  backgroundColor: getRoleBadgeColor(role),
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              >
                {role}
              </span>
            </div>
            <Text
              style={{
                color: '#525f7f',
                fontSize: '16px',
                lineHeight: '24px',
                marginTop: '24px',
              }}
            >
              Join the team to collaborate on invoices, manage customers, and track payments
              together.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button
              href={invitationUrl}
              style={{
                backgroundColor: '#5469d4',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
                textDecoration: 'none',
                textAlign: 'center' as const,
                display: 'inline-block',
                padding: '14px 32px',
              }}
            >
              Join Team
            </Button>
          </Section>

          <Section style={{ marginTop: '32px' }}>
            <Text style={{ color: '#525f7f', fontSize: '14px', lineHeight: '20px' }}>
              If the button above doesn't work, copy and paste this URL into your browser:
            </Text>
            <Link
              href={invitationUrl}
              style={{
                color: '#5469d4',
                fontSize: '14px',
                wordBreak: 'break-all',
                marginTop: '8px',
                display: 'block',
              }}
            >
              {invitationUrl}
            </Link>
          </Section>

          <Section style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e6ebf1' }}>
            <Text style={{ color: '#8898aa', fontSize: '13px', lineHeight: '20px' }}>
              <strong>Important:</strong> This invitation link will expire in {expiryDays} days. If
              you didn't expect this invitation, you can safely ignore this email.
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
};

export default TeamInvitationEmail;
