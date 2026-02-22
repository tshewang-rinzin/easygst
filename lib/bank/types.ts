// ============================================================
// Bank/Payment QR Integration - Type Definitions
// ============================================================

export interface QRPaymentRequest {
  amount: number;
  currency: string;
  invoiceNumber: string;
  invoiceId: string;
  customerName?: string;
  description?: string;
  expiryMinutes?: number;
}

export interface QRPaymentResponse {
  qrData: string; // Raw data to encode as QR
  qrImageUrl?: string; // If provider returns image
  referenceId: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentStatus {
  referenceId: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  paidAt?: Date;
  paidAmount?: number;
  transactionId?: string;
  metadata?: Record<string, any>;
}

export interface BankProvider {
  name: string;
  code: string;
  generateQR(request: QRPaymentRequest, config: BankIntegrationConfig): Promise<QRPaymentResponse>;
  checkStatus(referenceId: string, config: BankIntegrationConfig): Promise<PaymentStatus>;
  // Optional: handle webhook callback
  handleWebhook?(payload: any, secret: string): Promise<PaymentStatus | null>;
}

export interface BankIntegrationConfig {
  accountNumber?: string;
  accountName?: string;
  merchantId?: string;
  apiKey?: string;
  apiSecret?: string;
  config?: Record<string, any>;
}
