import { PaymentGateway } from './types';
import { RMAPaymentGateway } from './providers/rma-gateway';

const gateways: Record<string, () => PaymentGateway> = {
  rma: () => new RMAPaymentGateway(),
};

/**
 * Get the configured payment gateway.
 * Reads PAYMENT_GATEWAY env var (default: 'rma').
 */
export function getPaymentGateway(): PaymentGateway {
  const code = process.env.PAYMENT_GATEWAY || 'rma';
  const factory = gateways[code];
  if (!factory) {
    throw new Error(`Unknown payment gateway: ${code}. Available: ${Object.keys(gateways).join(', ')}`);
  }
  return factory();
}

export type { PaymentGateway, PaymentInitRequest, PaymentInitResponse, PaymentVerifyRequest, PaymentVerifyResponse } from './types';
