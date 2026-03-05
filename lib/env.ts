import { z } from 'zod';

const requiredString = (name: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.string().min(1, `${name} is required`)
  );

const optionalString = () =>
  z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().optional()
  );

const optionalUrl = () =>
  z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().url().optional()
  );

/**
 * Environment variable validation.
 * Import this module early to fail fast with clear error messages.
 *
 * Required vars must always be set.
 * Optional vars are validated if present but won't block startup.
 */

const serverSchema = z.object({
  // === Required ===
  POSTGRES_URL: requiredString('POSTGRES_URL'),
  AUTH_SECRET: requiredString('AUTH_SECRET'),
  BASE_URL: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.string().url('BASE_URL must be a valid URL')
  ),

  // === Optional (validated if present) ===
  NODE_ENV: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.enum(['development', 'production', 'test']).default('development')
  ),
  NEXT_PUBLIC_APP_URL: optionalUrl(),

  // Cron
  CRON_SECRET: optionalString(),

  // Upstash Redis (rate limiting)
  UPSTASH_REDIS_REST_URL: optionalUrl(),
  UPSTASH_REDIS_REST_TOKEN: optionalString(),

  // Email / SMTP
  EMAIL_ENABLED: optionalString(),
  EMAIL_FROM: optionalString(),
  EMAIL_FROM_NAME: optionalString(),
  SMTP_HOST: optionalString(),
  SMTP_PORT: optionalString(),
  SMTP_USER: optionalString(),
  SMTP_PASSWORD: optionalString(),
  SMTP_TLS_REJECT_UNAUTHORIZED: optionalString(),

  // Messaging
  MESSAGING_PROVIDER: optionalString(),
  PLAYSMS_URL: optionalString(),
  PLAYSMS_USERNAME: optionalString(),
  PLAYSMS_TOKEN: optionalString(),
  WHATSAPP_PROVIDER: optionalString(),
  TWILIO_ACCOUNT_SID: optionalString(),
  TWILIO_AUTH_TOKEN: optionalString(),
  TWILIO_PHONE_NUMBER: optionalString(),
  TWILIO_WHATSAPP_NUMBER: optionalString(),

  // Cloudflare R2
  R2_ACCOUNT_ID: optionalString(),
  R2_ACCESS_KEY_ID: optionalString(),
  R2_SECRET_ACCESS_KEY: optionalString(),
  R2_BUCKET_NAME: optionalString(),

  // Payment
  PAYMENT_GATEWAY: optionalString(),
  RMA_API_URL: optionalString(),
  RMA_API_KEY: optionalString(),
  RMA_MERCHANT_ID: optionalString(),

  // Admin
  PLATFORM_ADMIN_EMAIL: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().email().optional()
  ),
  PLATFORM_ADMIN_PASSWORD: optionalString(),

  // Misc
  LOG_LEVEL: optionalString(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

function validateEnv(): ServerEnv {
  const result = serverSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const formatted = Object.entries(errors)
      .map(([key, msgs]) => `  ❌ ${key}: ${msgs?.join(', ')}`)
      .join('\n');

    throw new Error(
      `\n⚠️  Environment validation failed:\n${formatted}\n\nCheck your .env file or Vercel environment variables.\n`
    );
  }

  return result.data;
}

export const env = validateEnv();
