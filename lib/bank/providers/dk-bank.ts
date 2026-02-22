// ============================================================
// DK Bank Provider — PLACEHOLDER
// TODO: Replace with actual DK Bank API integration when docs are available
// ============================================================

import { BankProvider, QRPaymentRequest, QRPaymentResponse, PaymentStatus, BankIntegrationConfig } from '../types';
import { randomUUID } from 'crypto';

export const dkBankProvider: BankProvider = {
  name: 'DK Bank',
  code: 'dk_bank',

  async generateQR(request: QRPaymentRequest, config: BankIntegrationConfig): Promise<QRPaymentResponse> {
    // TODO: Replace with actual DK Bank API call
    // This mock generates a reasonable QR payload format
    const referenceId = `DK-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const merchantId = config.merchantId || 'UNKNOWN';

    const qrData = `DKBANK://pay?merchant=${encodeURIComponent(merchantId)}&amount=${request.amount}&ref=${encodeURIComponent(request.invoiceNumber)}&currency=${request.currency}&txn=${referenceId}`;

    const expiresAt = request.expiryMinutes
      ? new Date(Date.now() + request.expiryMinutes * 60 * 1000)
      : new Date(Date.now() + 30 * 60 * 1000); // Default 30 min expiry

    return {
      qrData,
      referenceId,
      expiresAt,
      metadata: {
        provider: 'dk_bank',
        mock: true, // TODO: Remove when real API is integrated
        merchantId,
      },
    };
  },

  async checkStatus(referenceId: string, _config: BankIntegrationConfig): Promise<PaymentStatus> {
    // TODO: Replace with actual DK Bank API call to check payment status
    return {
      referenceId,
      status: 'pending',
      metadata: {
        provider: 'dk_bank',
        mock: true, // TODO: Remove when real API is integrated
      },
    };
  },

  async handleWebhook(payload: any, _secret: string): Promise<PaymentStatus | null> {
    // TODO: Implement webhook validation and parsing when DK Bank API docs are available
    // For now, expect a simple payload structure:
    // { referenceId, status, amount, transactionId }
    if (!payload?.referenceId) return null;

    return {
      referenceId: payload.referenceId,
      status: payload.status || 'pending',
      paidAt: payload.status === 'paid' ? new Date() : undefined,
      paidAmount: payload.amount ? Number(payload.amount) : undefined,
      transactionId: payload.transactionId,
      metadata: {
        provider: 'dk_bank',
        mock: true, // TODO: Remove when real API is integrated
        rawPayload: payload,
      },
    };
  },
};
