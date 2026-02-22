/**
 * TODO: Local Bhutanese SMS gateway provider (TashiCell / BT)
 * 
 * This is a placeholder for integration with local telecom providers.
 * WhatsApp is not supported via local gateway — use Twilio for WhatsApp.
 */

import { MessagingProvider, MessageRequest, MessageResponse } from '../types';

export class LocalBhutanProvider implements MessagingProvider {
  name = 'Local Bhutan Gateway';
  code = 'local_bt';

  async sendSMS(request: MessageRequest): Promise<MessageResponse> {
    // TODO: Integrate with TashiCell or BT SMS gateway API
    // Typical integration:
    //   - POST to gateway endpoint with sender, recipient, message
    //   - Authenticate via API key or username/password

    console.log(`[Local BT SMS] To: ${request.to}, Message: ${request.message.substring(0, 50)}...`);

    return {
      success: true,
      messageId: `local_sms_${Date.now()}`,
      provider: this.code,
    };
  }

  async sendWhatsApp(request: MessageRequest): Promise<MessageResponse> {
    // WhatsApp not supported via local gateway
    return {
      success: false,
      provider: this.code,
      error: 'WhatsApp is not supported via local Bhutan gateway. Use Twilio instead.',
    };
  }
}
