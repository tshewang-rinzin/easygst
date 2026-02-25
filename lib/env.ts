import { z } from 'zod';

/**
 * Environment variable validation.
 * Import this module early to fail fast with clear error messages.
 *
 * Required vars must always be set.
 * Optional vars are validated if present but won't block startup.
 */

const serverSchema = z.object({
  // === Required ===
  POSTGRES_URL: z.string().min(1, 'POSTGRES_URL is required'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  BASE_URL: z.string().url('BASE_URL must be a valid URL'),

  // === Optional (validated if present) ===
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Cron
  CRON_SECRET: z.string().optional(),

  // Upstash Redis (rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Email / SMTP
  EMAIL_ENABLED: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_TLS_REJECT_UNAUTHORIZED: z.string().optional(),

  // Messaging
  MESSAGING_PROVIDER: z.string().optional(),
  PLAYSMS_URL: z.string().optional(),
  PLAYSMS_USERNAME: z.string().optional(),
  PLAYSMS_TOKEN: z.string().optional(),
  WHATSAPP_PROVIDER: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),

  // Payment
  PAYMENT_GATEWAY: z.string().optional(),
  RMA_API_URL: z.string().optional(),
  RMA_API_KEY: z.string().optional(),
  RMA_MERCHANT_ID: z.string().optional(),

  // Admin
  PLATFORM_ADMIN_EMAIL: z.string().email().optional(),
  PLATFORM_ADMIN_PASSWORD: z.string().optional(),

  // Misc
  LOG_LEVEL: z.string().optional(),
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
