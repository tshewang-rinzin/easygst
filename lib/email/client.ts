import { db } from '@/lib/db/drizzle';
import { emailSettings } from '@/lib/db/schema';
import { decrypt, isEncrypted } from '@/lib/auth/crypto';

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

/**
 * Get email configuration (database first, then env fallback)
 */
export async function getEmailConfig() {
  const dbSettings = await getCachedEmailSettings();

  // If database settings exist and are enabled, use them
  if (dbSettings && dbSettings.emailEnabled) {
    let apiToken = dbSettings.smtpPassword || undefined;
    if (apiToken && isEncrypted(apiToken)) {
      try {
        apiToken = decrypt(apiToken);
      } catch (error) {
        console.error('[Email] Failed to decrypt API token:', error);
        apiToken = undefined;
      }
    }

    return {
      enabled: true,
      source: 'database' as const,
      apiToken,
      emailFrom: dbSettings.emailFrom || undefined,
      emailFromName: dbSettings.emailFromName || 'EasyGST',
    };
  }

  // Fall back to environment variables
  const envEnabled = process.env.EMAIL_ENABLED === 'true';

  return {
    enabled: envEnabled,
    source: 'environment' as const,
    apiToken: process.env.MAILTRAP_API_TOKEN,
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
 * Mailtrap transporter-compatible wrapper
 * Provides a sendMail interface matching what utils.ts/actions.ts expect
 */
function createMailtrapTransporter(apiToken: string) {
  return {
    sendMail: async (mailOptions: {
      from: { name: string; address: string } | string;
      to: string;
      subject: string;
      html: string;
      attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
      }>;
    }) => {
      const fromAddr: MailtrapAddress =
        typeof mailOptions.from === 'string'
          ? { email: mailOptions.from }
          : { email: mailOptions.from.address, name: mailOptions.from.name };

      // Parse recipients
      const toAddresses: MailtrapAddress[] = mailOptions.to
        .split(',')
        .map((email) => ({ email: email.trim() }));

      // Convert attachments to base64
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
      // Mailtrap API doesn't have a verify endpoint, just check token exists
      if (!apiToken) throw new Error('Mailtrap API token not configured');
      return true;
    },
  };
}

/**
 * Create email transporter using Mailtrap API v2
 */
export async function createEmailTransporter() {
  const config = await getEmailConfig();

  if (!config.enabled) {
    console.warn('[Email] Email sending is disabled.');
    return createNoopTransporter();
  }

  if (!config.apiToken) {
    console.error('[Email] Missing Mailtrap API token (MAILTRAP_API_TOKEN).');
    return createNoopTransporter();
  }

  console.log(`[Email] Mailtrap API transporter configured (source: ${config.source})`);
  return createMailtrapTransporter(config.apiToken);
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
