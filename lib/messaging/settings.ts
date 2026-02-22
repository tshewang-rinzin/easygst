/**
 * Messaging settings — reads from environment variables.
 * 
 * Default: playSMS for SMS, Twilio for WhatsApp.
 * playSMS doesn't support WhatsApp, so we use a split provider model.
 * 
 * Env vars:
 *   MESSAGING_PROVIDER=playsms (default) | twilio | local_bt
 *   PLAYSMS_URL=https://sms.example.com
 *   PLAYSMS_USERNAME=admin
 *   PLAYSMS_TOKEN=your-webservices-token
 *   WHATSAPP_PROVIDER=twilio (default) | none
 *   TWILIO_ACCOUNT_SID=...
 *   TWILIO_AUTH_TOKEN=...
 *   TWILIO_PHONE_NUMBER=+1234567890
 *   TWILIO_WHATSAPP_NUMBER=+1234567890
 */

export interface MessagingConfig {
  provider: 'playsms' | 'twilio' | 'local_bt';
  playsms?: {
    url: string;
    username: string;
    token: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    whatsappNumber: string;
  };
  /** WhatsApp provider — can differ from SMS provider (e.g., SMS via playSMS, WhatsApp via Twilio) */
  whatsappProvider: 'twilio' | 'none';
}

export function getMessagingConfig(): MessagingConfig {
  const provider = (process.env.MESSAGING_PROVIDER || 'playsms') as MessagingConfig['provider'];
  const whatsappProvider = (process.env.WHATSAPP_PROVIDER || 'twilio') as MessagingConfig['whatsappProvider'];

  return {
    provider,
    whatsappProvider,
    playsms: {
      url: process.env.PLAYSMS_URL || '',
      username: process.env.PLAYSMS_USERNAME || '',
      token: process.env.PLAYSMS_TOKEN || '',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
    },
  };
}
