// ============================================================
// Bank/Payment QR Integration — Provider Registry
// ============================================================

import { db } from '@/lib/db/drizzle';
import { bankIntegrations, paymentQrCodes, invoices } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { BankProvider, BankIntegrationConfig, QRPaymentResponse } from './types';
import { dkBankProvider } from './providers/dk-bank';

// ============================================================
// Provider Registry
// ============================================================

const providers: Record<string, BankProvider> = {
  dk_bank: dkBankProvider,
  // TODO: Add more providers as needed (bob, bnb, etc.)
};

/**
 * Get a bank provider implementation by code.
 */
export function getProvider(code: string): BankProvider | null {
  return providers[code] || null;
}

/**
 * Get the active bank integration for a team.
 */
export async function getActiveIntegration(teamId: string) {
  const [integration] = await db
    .select()
    .from(bankIntegrations)
    .where(and(eq(bankIntegrations.teamId, teamId), eq(bankIntegrations.isActive, true)))
    .limit(1);

  return integration || null;
}

/**
 * Build config object from a bank integration record.
 */
function buildConfig(integration: typeof bankIntegrations.$inferSelect): BankIntegrationConfig {
  return {
    accountNumber: integration.accountNumber ?? undefined,
    accountName: integration.accountName ?? undefined,
    merchantId: integration.merchantId ?? undefined,
    apiKey: integration.apiKey ?? undefined,
    apiSecret: integration.apiSecret ?? undefined,
    config: (integration.config as Record<string, any>) ?? undefined,
  };
}

/**
 * Main function: Generate a payment QR code for an invoice.
 * Returns existing non-expired QR if available.
 */
export async function generatePaymentQR(teamId: string, invoiceId: string): Promise<QRPaymentResponse> {
  // Check for existing non-expired QR
  const [existingQr] = await db
    .select()
    .from(paymentQrCodes)
    .where(
      and(
        eq(paymentQrCodes.teamId, teamId),
        eq(paymentQrCodes.invoiceId, invoiceId),
        eq(paymentQrCodes.status, 'pending'),
      )
    )
    .limit(1);

  if (existingQr && (!existingQr.expiresAt || existingQr.expiresAt > new Date())) {
    return {
      qrData: existingQr.qrData,
      qrImageUrl: existingQr.qrImageUrl ?? undefined,
      referenceId: existingQr.referenceId ?? '',
      expiresAt: existingQr.expiresAt ?? undefined,
      metadata: (existingQr.metadata as Record<string, any>) ?? undefined,
    };
  }

  // Get active integration
  const integration = await getActiveIntegration(teamId);
  if (!integration) {
    throw new Error('No active bank integration found for this team');
  }

  const provider = getProvider(integration.provider);
  if (!provider) {
    throw new Error(`Bank provider "${integration.provider}" not found`);
  }

  // Get invoice details
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.teamId, teamId)))
    .limit(1);

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const config = buildConfig(integration);

  // Generate QR via provider
  const result = await provider.generateQR(
    {
      amount: Number(invoice.amountDue),
      currency: invoice.currency,
      invoiceNumber: invoice.invoiceNumber,
      invoiceId: invoice.id,
      expiryMinutes: 30,
    },
    config
  );

  // Store in DB
  await db.insert(paymentQrCodes).values({
    teamId,
    invoiceId,
    provider: integration.provider,
    qrData: result.qrData,
    qrImageUrl: result.qrImageUrl ?? null,
    amount: String(invoice.amountDue),
    currency: invoice.currency,
    referenceId: result.referenceId,
    status: 'pending',
    expiresAt: result.expiresAt ?? null,
    metadata: result.metadata ?? null,
  });

  return result;
}
