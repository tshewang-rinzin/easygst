import { db } from '@/lib/db/drizzle';
import { emailSettings } from '@/lib/db/schema';
import { decrypt, isEncrypted } from '@/lib/auth/crypto';
import nodemailer from 'nodemailer';

// Cache for email settings to avoid repeated DB queries
let cachedSettings: {
  data: typeof emailSettings.$inferSelect | null;
  timestamp: number;
} | null = null;

const CACHE_TTL = 60 * 1000; // 1 minute cache

const MAILTRAP_API_URL = 'https://send.api.mailtrap.io/api/send';

/**
 * Get email settings from database with caching
 */
async function getCachedEmailSettings() {
  const now = Date.now();

  if (cachedSettings && now - cachedSettings.timestamp < CACHE_TTL) {
    return cachedSettings.data;
  }

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

function decryptIfNeeded(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (isEncrypted(value)) {
    try {
      return decrypt(value);
    } catch (error) {
      console.error('[Email] Failed to decrypt value:', error);
      return undefined;
    }
  }
  return value;
}

/**
 * Get email configuration (database first, then env fallback)
 */
export async function getEmailConfig() {
  const dbSettings = await getCachedEmailSettings();

  // If database settings exist and are enabled, use them
  if (dbSettings && dbSettings.emailEnabled) {
    const provider = dbSettings.provider || 'mailtrap_api';
    // For API token: prefer apiToken, fall back to smtpPassword for backward compat
    const apiToken = decryptIfNeeded(dbSettings.apiToken) || decryptIfNeeded(dbSettings.smtpPassword);
    const smtpPassword = decryptIfNeeded(dbSettings.smtpPassword);

    return {
      enabled: true,
      source: 'database' as const,
      provider,
      apiToken,
      smtpHost: dbSettings.smtpHost || undefined,
      smtpPort: dbSettings.smtpPort || undefined,
      smtpUser: dbSettings.smtpUser || undefined,
      smtpPassword,
      smtpSecure: dbSettings.smtpSecure ?? false,
      tlsRejectUnauthorized: dbSettings.tlsRejectUnauthorized ?? true,
      emailFrom: dbSettings.emailFrom || undefined,
      emailFromName: dbSettings.emailFromName || 'EasyGST',
    };
  }

  // Fall back to environment variables
  const envEnabled = process.env.EMAIL_ENABLED === 'true';
  const provider = process.env.EMAIL_PROVIDER || 'mailtrap_api';

  return {
    enabled: envEnabled,
    source: 'environment' as const,
    provider,
    apiToken: process.env.MAILTRAP_API_TOKEN,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpSecure: process.env.SMTP_SECURE === 'true',
    tlsRejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    emailFrom: process.env.EMAIL_FROM,
    emailFromName: process.env.EMAIL_FROM_NAME || 'EasyGST',
  };
}

interface MailtrapAddress {
  email: string;
  name?: string;
}

interface MailtrapAttachment {
  filename: string;
  content: string; // base64
  type?: string;
  disposition?: string;
}

interface MailtrapSendOptions {
  from: MailtrapAddress;
  to: MailtrapAddress[];
  subject: string;
  html: string;
  attachments?: MailtrapAttachment[];
}

/**
 * Send email via Mailtrap API v2
 */
async function sendViaMailtrapAPI(
  apiToken: string,
  options: MailtrapSendOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const body: Record<string, unknown> = {
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    if (options.attachments && options.attachments.length > 0) {
      body.attachments = options.attachments;
    }

    const response = await fetch(MAILTRAP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Email] Mailtrap API error:', response.status, data);
      return {
        success: false,
        error: data?.errors?.join(', ') || data?.message || `API error ${response.status}`,
      };
    }

    console.log('[Email] Mailtrap API response:', data);
    return {
      success: true,
      messageId: data?.message_ids?.[0] || data?.id || 'sent-' + Date.now(),
    };
  } catch (error) {
    console.error('[Email] Mailtrap API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Shared mail options interface used by both transporter types
 */
interface TransporterMailOptions {
  from: { name: string; address: string } | string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Mailtrap transporter-compatible wrapper
 */
function createMailtrapTransporter(apiToken: string) {
  return {
    sendMail: async (mailOptions: TransporterMailOptions) => {
      const fromAddr: MailtrapAddress =
        typeof mailOptions.from === 'string'
          ? { email: mailOptions.from }
          : { email: mailOptions.from.address, name: mailOptions.from.name };

      const toAddresses: MailtrapAddress[] = mailOptions.to
        .split(',')
        .map((email) => ({ email: email.trim() }));

      const attachments: MailtrapAttachment[] = (mailOptions.attachments || []).map((att) => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content)
          ? att.content.toString('base64')
          : att.content,
        type: att.contentType || 'application/pdf',
        disposition: 'attachment',
      }));

      const result = await sendViaMailtrapAPI(apiToken, {
        from: fromAddr,
        to: toAddresses,
        subject: mailOptions.subject,
        html: mailOptions.html,
        attachments,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email via Mailtrap API');
      }

      return { messageId: result.messageId };
    },
    verify: async () => {
      if (!apiToken) throw new Error('Mailtrap API token not configured');
      return true;
    },
  };
}

/**
 * SMTP transporter using nodemailer
 */
function createSmtpTransporter(config: {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  tlsRejectUnauthorized: boolean;
}) {
  const transport = nodemailer.createTransport({
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

  return {
    sendMail: async (mailOptions: TransporterMailOptions) => {
      const info = await transport.sendMail({
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        attachments: mailOptions.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      });
      return { messageId: info.messageId };
    },
    verify: async () => {
      await transport.verify();
      return true;
    },
  };
}

function createNoopTransporter() {
  return {
    sendMail: async (options: any) => {
      console.log('[Email] Noop: would send to', options.to);
      return { messageId: 'noop-' + Date.now() };
    },
    verify: async () => true,
  };
}

/**
 * Create email transporter based on provider configuration
 */
export async function createEmailTransporter() {
  const config = await getEmailConfig();

  if (!config.enabled) {
    console.warn('[Email] Email sending is disabled.');
    return createNoopTransporter();
  }

  const provider = config.provider;

  if (provider === 'smtp') {
    if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
      console.error('[Email] Incomplete SMTP configuration.');
      return createNoopTransporter();
    }
    console.log(`[Email] SMTP transporter configured (source: ${config.source})`);
    return createSmtpTransporter({
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUser: config.smtpUser,
      smtpPassword: config.smtpPassword,
      smtpSecure: config.smtpSecure,
      tlsRejectUnauthorized: config.tlsRejectUnauthorized,
    });
  }

  // Default: mailtrap_api
  if (!config.apiToken) {
    console.error('[Email] Missing Mailtrap API token.');
    return createNoopTransporter();
  }

  console.log(`[Email] Mailtrap API transporter configured (source: ${config.source})`);
  return createMailtrapTransporter(config.apiToken);
}

/**
 * @deprecated Use createEmailTransporter() instead
 */
export function getEmailTransporter() {
  const apiToken = process.env.MAILTRAP_API_TOKEN;
  if (!apiToken || process.env.EMAIL_ENABLED !== 'true') {
    return createNoopTransporter();
  }
  return createMailtrapTransporter(apiToken);
}

/**
 * Verify email connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = await createEmailTransporter();
    await transporter.verify();
    console.log('[Email] Email configuration verified');
    return true;
  } catch (error) {
    console.error('[Email] Email verification failed:', error);
    return false;
  }
}

/**
 * Get the default "from" email address
 */
export async function getFromEmailAsync(): Promise<string> {
  const config = await getEmailConfig();
  return config.emailFrom || 'no-reply@easygst.bt';
}

/**
 * @deprecated Use getFromEmailAsync() instead
 */
export function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'no-reply@easygst.bt';
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
