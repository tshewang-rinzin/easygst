export interface PaymentInitRequest {
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  metadata: {
    teamId: string;
    planId: string;
    subscriptionId: string;
    billingCycle: string;
  };
}

export interface PaymentInitResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface PaymentVerifyRequest {
  transactionId: string;
  gatewayParams: Record<string, string>;
}

export interface PaymentVerifyResponse {
  success: boolean;
  paid: boolean;
  amount?: number;
  transactionId?: string;
  error?: string;
  rawResponse?: Record<string, any>;
}

export interface PaymentGateway {
  name: string;
  code: string;
  initiate(request: PaymentInitRequest): Promise<PaymentInitResponse>;
  verify(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse>;
}
