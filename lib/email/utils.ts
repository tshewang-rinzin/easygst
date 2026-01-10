import { render } from '@react-email/render';
import { getEmailTransporter, getFromEmail, isEmailEnabled } from './client';
import type { ReactElement } from 'react';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: ReactElement;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

/**
 * Send an email using the configured SMTP server
 */
export async function sendEmail({
  to,
  subject,
  template,
  attachments = [],
}: SendEmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Check if email is enabled
    if (!isEmailEnabled()) {
      console.log('[Email] Email sending is disabled. Email would be sent to:', to);
      console.log('[Email] Subject:', subject);
      return {
        success: true,
        messageId: 'disabled-' + Date.now(),
      };
    }

    // Render the React email template to HTML
    const html = await render(template);

    // Get the transporter
    const transporter = getEmailTransporter();
    const from = getFromEmail();

    // Prepare email recipients
    const recipients = Array.isArray(to) ? to.join(', ') : to;

    console.log('[Email] Sending email to:', recipients);
    console.log('[Email] Subject:', subject);

    // Send email
    const info = await transporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || 'EasyGST',
        address: from,
      },
      to: recipients,
      subject,
      html,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || 'application/pdf',
      })),
    });

    console.log('[Email] Email sent successfully. Message ID:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a test email to verify email configuration
 */
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { default: TestEmail } = await import('./templates/test-email');

    return await sendEmail({
      to,
      subject: 'Test Email from EasyGST',
      template: TestEmail(),
    });
  } catch (error) {
    console.error('[Email] Failed to send test email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format email recipient with name
 */
export function formatEmailRecipient(name: string, email: string): string {
  return `${name} <${email}>`;
}
