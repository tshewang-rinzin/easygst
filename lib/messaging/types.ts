export interface MessageRequest {
  to: string; // phone number (E.164 format)
  message: string;
  mediaUrl?: string; // PDF URL for WhatsApp
  templateId?: string; // WhatsApp template ID
  templateParams?: Record<string, string>;
}

export interface MessageResponse {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
}

export interface MessagingProvider {
  name: string;
  code: string;
  sendSMS(request: MessageRequest): Promise<MessageResponse>;
  sendWhatsApp(request: MessageRequest): Promise<MessageResponse>;
}
