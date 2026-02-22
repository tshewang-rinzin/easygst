import { randomUUID } from 'crypto';
import {
  PaymentGateway,
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentVerifyRequest,
  PaymentVerifyResponse,
} from '../types';

/**
 * TODO: Replace with real RMA Payment Gateway integration.
 *
 * This is a placeholder that simulates the RMA (Royal Monetary Authority)
 * payment gateway for Bhutan. When the real API is available:
 * 1. Replace initiate() with actual API call to create a payment session
 * 2. Replace verify() with actual API call to verify payment status
 * 3. Add webhook signature verification
 *
 * Environment variables needed:
 * - RMA_MERCHANT_ID: Your merchant ID from RMA
 * - RMA_API_KEY: API key for authentication
 * - RMA_API_URL: Base URL of the RMA payment API
 */
export class RMAPaymentGateway implements PaymentGateway {
  name = 'RMA Payment Gateway';
  code = 'rma';

  private merchantId: string;
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.merchantId = process.env.RMA_MERCHANT_ID || 'test_merchant';
    this.apiKey = process.env.RMA_API_KEY || 'test_key';
    this.apiUrl = process.env.RMA_API_URL || 'https://pay.rma.org.bt/api/v1';
  }

  async initiate(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    try {
      // TODO: Replace with real RMA API call
      // const response = await fetch(`${this.apiUrl}/payments/create`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'X-Merchant-ID': this.merchantId,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     amount: request.amount,
      //     currency: request.currency,
      //     description: request.description,
      //     return_url: request.returnUrl,
      //     cancel_url: request.cancelUrl,
      //     metadata: request.metadata,
      //   }),
      // });

      const transactionId = `RMA-${randomUUID().slice(0, 8).toUpperCase()}`;
      const paymentUrl = `https://pay.rma.org.bt/checkout?txn=${transactionId}&amount=${request.amount}&currency=${request.currency}&merchant=${this.merchantId}&return_url=${encodeURIComponent(request.returnUrl)}`;

      return {
        success: true,
        paymentUrl,
        transactionId,
      };
    } catch (error) {
      console.error('[RMA Gateway] Initiation error:', error);
      return {
        success: false,
        error: 'Failed to initiate payment with RMA gateway',
      };
    }
  }

  async verify(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      // TODO: Replace with real RMA API verification
      // const response = await fetch(`${this.apiUrl}/payments/${request.transactionId}/verify`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'X-Merchant-ID': this.merchantId,
      //   },
      // });

      // Mock: check for status=success in gateway params
      const paid = request.gatewayParams.status === 'success';

      return {
        success: true,
        paid,
        amount: paid ? parseFloat(request.gatewayParams.amount || '0') : undefined,
        transactionId: request.transactionId,
        rawResponse: request.gatewayParams,
      };
    } catch (error) {
      console.error('[RMA Gateway] Verification error:', error);
      return {
        success: false,
        paid: false,
        error: 'Failed to verify payment with RMA gateway',
      };
    }
  }
}
