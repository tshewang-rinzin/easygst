import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '@/lib/db/drizzle';
import { emailSettings } from '@/lib/db/schema';

// Cache for email settings to avoid repeated DB queries
let cachedSettings: {
  data: typeof emailSettings.$inferSelect | null;
  timestamp: number;
} | null = null;

const CACHE_TTL = 60 * 1000; // 1 minute cache

/**
 * Get email settings from database with caching
 */
async function getCachedEmailSettings() {
  const now = Date.now();

  // Return cached settings if still valid
  if (cachedSettings && now - cachedSettings.timestamp < CACHE_TTL) {
    return cachedSettings.data;
  }

  // Fetch from database
  try {
    const [settings] = await db.select().from(emailSettings).limit(1);
    cachedSettings = { data: settings || null, timestamp: now };
    return cachedSettings.data;
  } catch (error) {
    console.error('[Email] Failed to fetch email settings from database:', error);
    return null;
  }
}

/**
 * Clear the settings cache (call after updating settings)
 */
export function clearEmailSettingsCache() {
  cachedSettings = null;
}

/**
 * Get email configuration (database first, then env fallback)
 */
export async function getEmailConfig() {
  const dbSettings = await getCachedEmailSettings();

  // If database settings exist and are enabled, use them
  if (dbSettings && dbSettings.emailEnabled) {
    return {
      enabled: true,
      source: 'database' as const,
      smtpHost: dbSettings.smtpHost || undefined,
      smtpPort: dbSettings.smtpPort || undefined,
      smtpUser: dbSettings.smtpUser || undefined,
      smtpPassword: dbSettings.smtpPassword || undefined,
      smtpSecure: dbSettings.smtpSecure ?? false,
      emailFrom: dbSettings.emailFrom || undefined,
      emailFromName: dbSettings.emailFromName || 'EasyGST',
      tlsRejectUnauthorized: dbSettings.tlsRejectUnauthorized ?? true,
    };
  }

  // Fall back to environment variables
  const envEnabled = process.env.EMAIL_ENABLED === 'true';

  return {
    enabled: envEnabled,
    source: 'environment' as const,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpSecure: process.env.SMTP_PORT === '465',
    emailFrom: process.env.EMAIL_FROM,
    emailFromName: process.env.EMAIL_FROM_NAME || 'EasyGST',
    tlsRejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
  };
}

/**
 * Create email transporter based on current configuration
 */
export async function createEmailTransporter(): Promise<Transporter> {
  const config = await getEmailConfig();

  if (!config.enabled) {
    console.warn('[Email] Email sending is disabled.');
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
    console.error('[Email] Missing SMTP configuration.');
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: config.tlsRejectUnauthorized,
      },
    });

    console.log(`[Email] SMTP transporter configured (source: ${config.source})`);
    return transporter;
  } catch (error) {
    console.error('[Email] Failed to create SMTP transporter:', error);
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }
}

// Legacy sync functions for backward compatibility
let transporter: Transporter | null = null;

/**
 * @deprecated Use createEmailTransporter() instead
 * Get or create the email transporter (sync version for backward compatibility)
 */
export function getEmailTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  // Sync fallback - only uses env variables
  const emailEnabled = process.env.EMAIL_ENABLED === 'true';

  if (!emailEnabled) {
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  });

  return transporter;
}

/**
 * Verify email connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = await createEmailTransporter();
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
export async function getFromEmailAsync(): Promise<string> {
  const config = await getEmailConfig();
  return config.emailFrom || 'noreply@easygst.bt';
}

/**
 * @deprecated Use getFromEmailAsync() instead
 */
export function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'noreply@easygst.bt';
}

/**
 * Check if email is enabled (async - checks database first)
 */
export async function isEmailEnabledAsync(): Promise<boolean> {
  const config = await getEmailConfig();
  return config.enabled;
}

/**
 * @deprecated Use isEmailEnabledAsync() instead
 */
export function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED === 'true';
}
