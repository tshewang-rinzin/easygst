import { MessagingProvider, MessageRequest, MessageResponse } from '../types';

export interface PlaySMSConfig {
  url: string;       // e.g., https://sms.example.com
  username: string;
  token: string;     // webservices token from playSMS user settings
}

/**
 * playSMS SMS Gateway provider.
 * Uses the playSMS webservices API to send SMS.
 * Docs: https://github.com/playsms/playsms
 * 
 * API: GET/POST {PLAYSMS_URL}/index.php?app=ws&u={USER}&h={TOKEN}&op=pv&to={PHONE}&msg={MSG}
 */
export class PlaySMSProvider implements MessagingProvider {
  name = 'playSMS';
  code = 'playsms';

  private config: PlaySMSConfig;

  constructor(config?: Partial<PlaySMSConfig>) {
    this.config = {
      url: config?.url || process.env.PLAYSMS_URL || '',
      username: config?.username || process.env.PLAYSMS_USERNAME || '',
      token: config?.token || process.env.PLAYSMS_TOKEN || '',
    };
  }

  async sendSMS(request: MessageRequest): Promise<MessageResponse> {
    if (!this.config.url || !this.config.username || !this.config.token) {
      return {
        success: false,
        provider: this.code,
        error: 'playSMS not configured. Set PLAYSMS_URL, PLAYSMS_USERNAME, PLAYSMS_TOKEN environment variables.',
      };
    }

    try {
      // Strip the + from E.164 format — playSMS typically expects numbers without +
      const phone = request.to.startsWith('+') ? request.to.slice(1) : request.to;

      const params = new URLSearchParams({
        app: 'ws',
        u: this.config.username,
        h: this.config.token,
        op: 'pv',
        to: phone,
        msg: request.message,
      });

      // Check if message contains non-ASCII (Dzongkha etc.) — enable unicode
      const hasUnicode = /[^\x00-\x7F]/.test(request.message);
      if (hasUnicode) {
        params.set('unicode', '1');
      }

      const url = `${this.config.url.replace(/\/$/, '')}/index.php?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        return {
          success: false,
          provider: this.code,
          error: `playSMS API returned HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json() as {
        status: string;
        error: string;
        data?: { queue?: string; smslog_id?: string; to?: string };
      };

      // playSMS returns status "OK" on success, "ERR" on failure
      if (data.status === 'OK') {
        return {
          success: true,
          provider: this.code,
          messageId: data.data?.smslog_id || data.data?.queue || undefined,
        };
      }

      return {
        success: false,
        provider: this.code,
        error: `playSMS error: ${data.error || 'Unknown error'}`,
      };
    } catch (error) {
      return {
        success: false,
        provider: this.code,
        error: `playSMS request failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * playSMS does not support WhatsApp — returns error.
   * Use Twilio for WhatsApp alongside playSMS for SMS.
   */
  async sendWhatsApp(request: MessageRequest): Promise<MessageResponse> {
    return {
      success: false,
      provider: this.code,
      error: 'playSMS does not support WhatsApp. Configure Twilio for WhatsApp messaging.',
    };
  }
}
