import { MessagingProvider, MessageResponse } from './types';
import { TwilioProvider } from './providers/twilio';
import { LocalBhutanProvider } from './providers/local';
import { PlaySMSProvider, type PlaySMSConfig } from './providers/playsms';
import { getMessagingConfig } from './settings';

/**
 * Returns the configured SMS provider.
 * Default: playSMS
 */
export function getSMSProvider(): MessagingProvider {
  const config = getMessagingConfig();

  switch (config.provider) {
    case 'playsms':
      return new PlaySMSProvider(config.playsms!);
    case 'twilio':
      return new TwilioProvider(config.twilio);
    case 'local_bt':
      return new LocalBhutanProvider();
    default:
      return new PlaySMSProvider(config.playsms!);
  }
}

/**
 * Returns the configured WhatsApp provider.
 * playSMS doesn't support WhatsApp, so this defaults to Twilio.
 */
export function getWhatsAppProvider(): MessagingProvider | null {
  const config = getMessagingConfig();

  switch (config.whatsappProvider) {
    case 'twilio':
      return new TwilioProvider(config.twilio);
    case 'none':
      return null;
    default:
      return new TwilioProvider(config.twilio);
  }
}

/**
 * Legacy: returns the SMS provider (backward compatible).
 */
export function getMessagingProvider(): MessagingProvider {
  return getSMSProvider();
}

/**
 * Convenience: send an SMS message via configured provider (playSMS by default).
 */
export async function sendSMS(to: string, message: string): Promise<MessageResponse> {
  const provider = getSMSProvider();
  return provider.sendSMS({ to, message });
}

/**
 * Convenience: send a WhatsApp message via configured provider (Twilio by default).
 */
export async function sendWhatsApp(to: string, message: string, mediaUrl?: string): Promise<MessageResponse> {
  const provider = getWhatsAppProvider();
  if (!provider) {
    return { success: false, provider: 'none', error: 'WhatsApp provider not configured. Set WHATSAPP_PROVIDER=twilio and configure Twilio credentials.' };
  }
  return provider.sendWhatsApp({ to, message, mediaUrl });
}

/**
 * Validate E.164 phone number format.
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}
