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

export const TestEmail = () => (
  <Html>
    <Head />
    <Preview>Test email from EasyGST</Preview>
    <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
      <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '40px', maxWidth: '600px' }}>
        <Section style={{ textAlign: 'center' as const }}>
          <Heading style={{ color: '#32325d', fontSize: '24px' }}>
            Test Email from EasyGST
          </Heading>
          <Text style={{ color: '#525f7f', fontSize: '16px', marginTop: '24px' }}>
            This is a test email to verify your email configuration is working correctly.
          </Text>
          <Text style={{ color: '#525f7f', fontSize: '14px', marginTop: '24px' }}>
            If you received this email, your email settings are configured properly!
          </Text>
          <Text style={{ color: '#8898aa', fontSize: '12px', marginTop: '32px' }}>
            Sent from EasyGST at {new Date().toLocaleString()}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default TestEmail;
