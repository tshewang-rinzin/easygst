import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

/**
 * Get or create the email transporter
 * Uses SMTP configuration from environment variables
 */
export function getEmailTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  // Check if email is enabled
  const emailEnabled = process.env.EMAIL_ENABLED === 'true';

  if (!emailEnabled) {
    console.warn('[Email] Email sending is disabled. Set EMAIL_ENABLED=true to enable.');
    // Return a test transporter that just logs emails
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return transporter;
  }

  // Validate required SMTP environment variables
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !emailFrom) {
    console.error('[Email] Missing SMTP configuration. Please set the following environment variables:');
    console.error('  - SMTP_HOST');
    console.error('  - SMTP_PORT');
    console.error('  - SMTP_USER');
    console.error('  - SMTP_PASSWORD');
    console.error('  - EMAIL_FROM');

    // Return a test transporter for development
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return transporter;
  }

  try {
    // Create SMTP transporter
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      // Optional: Add TLS options if needed
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
      },
    });

    console.log('[Email] SMTP transporter configured successfully');
    return transporter;
  } catch (error) {
    console.error('[Email] Failed to create SMTP transporter:', error);

    // Fallback to test transporter
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return transporter;
  }
}

/**
 * Verify email connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    console.log('[Email] SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('[Email] SMTP connection verification failed:', error);
    return false;
  }
}

/**
 * Get the default "from" email address
 */
export function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'noreply@easygst.bt';
}

/**
 * Check if email is enabled
 */
export function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED === 'true';
}
