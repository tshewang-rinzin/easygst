'use server';

import { z } from 'zod';
import { sendEmail, isValidEmail } from './utils';
import InvoiceEmail from './templates/invoice-email';
import PaymentReceiptEmail from './templates/payment-receipt-email';
import PaymentReminderEmail from './templates/payment-reminder-email';
import QuotationEmail from './templates/quotation-email';
import { db } from '@/lib/db/drizzle';
import { invoices, invoiceItems, customers, customerPayments, teams, emailSettings, quotations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import { getEmailSettings } from './queries';
import { clearEmailSettingsCache } from './client';
import { encrypt } from '@/lib/auth/crypto';

/**
 * Send invoice email to customer
 */
export async function sendInvoiceEmail(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get team for auth
    const team = await getTeamForUser();
    if (!team) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get invoice with customer details
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      with: {
        customer: true,
        items: true,
        team: true,
      },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.teamId !== team.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate customer email
    if (!invoice.customer.email) {
      return { success: false, error: 'Customer email not found' };
    }

    if (!isValidEmail(invoice.customer.email)) {
      return { success: false, error: 'Invalid customer email address' };
    }

    // Prepare email data
    const items = invoice.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: `${invoice.currency} ${parseFloat(item.unitPrice).toFixed(2)}`,
      total: `${invoice.currency} ${parseFloat(item.lineTotal).toFixed(2)}`,
    }));

    const formatCurrency = (amount: string) =>
      `${invoice.currency} ${parseFloat(amount).toFixed(2)}`;

    // Generate view URL (adjust based on your domain)
    const viewUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`
      : undefined;

    // Send email
    const displayName = invoice.team.businessName || invoice.team.name;
    const result = await sendEmail({
      to: invoice.customer.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${displayName}`,
      template: InvoiceEmail({
        businessName: displayName,
        customerName: invoice.customer.name,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        dueDate: invoice.dueDate
          ? new Date(invoice.dueDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Upon receipt',
        totalAmount: formatCurrency(invoice.totalAmount),
        currency: invoice.currency,
        items,
        subtotal: formatCurrency(invoice.subtotal),
        totalTax: formatCurrency(invoice.totalTax),
        viewUrl,
        paymentInstructions: undefined, // TODO: Add default payment instructions to team schema
      }),
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('[Email] Error sending invoice email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send payment receipt email to customer
 */
export async function sendPaymentReceiptEmail(
  paymentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get team for auth
    const team = await getTeamForUser();
    if (!team) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get payment with related data
    const payment = await db.query.customerPayments.findFirst({
      where: eq(customerPayments.id, paymentId),
      with: {
        customer: true,
        team: true,
        allocations: {
          with: {
            invoice: true,
          },
        },
      },
    });

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    if (payment.teamId !== team.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate customer email
    if (!payment.customer.email) {
      return { success: false, error: 'Customer email not found' };
    }

    if (!isValidEmail(payment.customer.email)) {
      return { success: false, error: 'Invalid customer email address' };
    }

    // Generate view URL
    const viewUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/payments/receipts/${payment.id}`
      : undefined;

    // Get invoice number(s) from allocations
    let invoiceNumber = 'N/A';
    if (payment.allocations && payment.allocations.length > 0) {
      if (payment.allocations.length === 1) {
        invoiceNumber = payment.allocations[0].invoice?.invoiceNumber || 'N/A';
      } else {
        invoiceNumber = 'Multiple Invoices';
      }
    }

    // Send email
    const displayName = payment.team.businessName || payment.team.name;
    const result = await sendEmail({
      to: payment.customer.email,
      subject: `Payment Receipt ${payment.receiptNumber} from ${displayName}`,
      template: PaymentReceiptEmail({
        businessName: displayName,
        customerName: payment.customer.name,
        receiptNumber: payment.receiptNumber || `RCP-${payment.id}`,
        paymentDate: new Date(payment.paymentDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        invoiceNumber,
        paymentAmount: `${payment.currency} ${parseFloat(payment.amount).toFixed(2)}`,
        paymentMethod: payment.paymentMethod,
        currency: payment.currency,
        referenceNumber: payment.transactionId || undefined,
        viewUrl,
      }),
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('[Email] Error sending payment receipt email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send payment reminder email to customer
 */
export async function sendPaymentReminderEmail(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get team for auth
    const team = await getTeamForUser();
    if (!team) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get invoice with customer details
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      with: {
        customer: true,
        team: true,
      },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.teamId !== team.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if invoice is already paid
    if (invoice.paymentStatus === 'paid') {
      return { success: false, error: 'Invoice is already paid' };
    }

    // Validate customer email
    if (!invoice.customer.email) {
      return { success: false, error: 'Customer email not found' };
    }

    if (!isValidEmail(invoice.customer.email)) {
      return { success: false, error: 'Invalid customer email address' };
    }

    // Calculate days overdue
    let daysOverdue = 0;
    if (invoice.dueDate) {
      const today = new Date();
      const dueDate = new Date(invoice.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysOverdue = diffDays > 0 ? diffDays : 0;
    }

    // Generate view URL
    const viewUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`
      : undefined;

    // Send email
    const displayName = invoice.team.businessName || invoice.team.name;
    const result = await sendEmail({
      to: invoice.customer.email,
      subject: daysOverdue > 0
        ? `Payment Overdue: Invoice ${invoice.invoiceNumber}`
        : `Payment Reminder: Invoice ${invoice.invoiceNumber}`,
      template: PaymentReminderEmail({
        businessName: displayName,
        customerName: invoice.customer.name,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        dueDate: invoice.dueDate
          ? new Date(invoice.dueDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Upon receipt',
        amountDue: `${invoice.currency} ${parseFloat(invoice.amountDue).toFixed(2)}`,
        currency: invoice.currency,
        daysOverdue,
        viewUrl,
        paymentInstructions: undefined, // TODO: Add default payment instructions to team schema
      }),
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('[Email] Error sending payment reminder email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send quotation email to customer
 */
export async function sendQuotationEmail(
  quotationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get team for auth
    const team = await getTeamForUser();
    if (!team) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get quotation with customer and items
    const quotation = await db.query.quotations.findFirst({
      where: eq(quotations.id, quotationId),
      with: {
        customer: true,
        items: true,
        team: true,
      },
    });

    if (!quotation) {
      return { success: false, error: 'Quotation not found' };
    }

    if (quotation.teamId !== team.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate customer email
    if (!quotation.customer.email) {
      return { success: false, error: 'Customer email not found' };
    }

    if (!isValidEmail(quotation.customer.email)) {
      return { success: false, error: 'Invalid customer email address' };
    }

    // Prepare email data
    const items = quotation.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: `${quotation.currency} ${parseFloat(item.unitPrice).toFixed(2)}`,
      total: `${quotation.currency} ${parseFloat(item.lineTotal).toFixed(2)}`,
    }));

    const formatCurrency = (amount: string) =>
      `${quotation.currency} ${parseFloat(amount).toFixed(2)}`;

    // Generate view URL
    const viewUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/quotations/${quotation.id}`
      : undefined;

    // Send email
    const displayName = quotation.team.businessName || quotation.team.name;
    const result = await sendEmail({
      to: quotation.customer.email,
      subject: `Quotation ${quotation.quotationNumber} from ${displayName}`,
      template: QuotationEmail({
        businessName: displayName,
        customerName: quotation.customer.name,
        quotationNumber: quotation.quotationNumber,
        quotationDate: new Date(quotation.quotationDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        validUntil: quotation.validUntil
          ? new Date(quotation.validUntil).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Not specified',
        totalAmount: formatCurrency(quotation.totalAmount),
        currency: quotation.currency,
        items,
        subtotal: formatCurrency(quotation.subtotal),
        totalTax: formatCurrency(quotation.totalTax),
        viewUrl,
      }),
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('[Email] Error sending quotation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

// ============================================================
// EMAIL SETTINGS ACTIONS
// ============================================================

const emailSettingsSchema = z.object({
  provider: z.enum(['mailtrap_api', 'smtp']).default('mailtrap_api'),
  apiToken: z.string().optional(), // For Mailtrap API provider
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  emailFrom: z.string().email('Invalid email address'),
  emailFromName: z.string().min(1, 'From name is required'),
  emailEnabled: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  tlsRejectUnauthorized: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
});

/**
 * Update global email settings
 */
export const updateEmailSettings = validatedActionWithRole(
  emailSettingsSchema,
  'owner',
  async (data, _, user) => {
    try {
      const existing = await getEmailSettings();
      const provider = data.provider || 'mailtrap_api';

      // Conditional validation based on provider
      if (data.emailEnabled) {
        if (provider === 'smtp') {
          if (!data.smtpHost || !data.smtpPort || !data.smtpUser) {
            return { error: 'SMTP host, port, and user are required for SMTP provider' };
          }
          if (!data.smtpPassword && !existing?.smtpPassword) {
            return { error: 'SMTP password is required for SMTP provider' };
          }
        } else {
          // mailtrap_api
          if (!data.apiToken && !existing?.apiToken && !existing?.smtpPassword) {
            return { error: 'API token is required for Mailtrap API provider' };
          }
        }
      }

      // Encrypt secrets
      const smtpPasswordToUse = data.smtpPassword && data.smtpPassword.length > 0
        ? encrypt(data.smtpPassword)
        : existing?.smtpPassword;

      const apiTokenToUse = data.apiToken && data.apiToken.length > 0
        ? encrypt(data.apiToken)
        : existing?.apiToken;

      const settingsData = {
        provider,
        apiToken: apiTokenToUse || null,
        smtpHost: data.smtpHost || null,
        smtpPort: data.smtpPort || null,
        smtpUser: data.smtpUser || null,
        smtpPassword: smtpPasswordToUse || null,
        smtpSecure: data.smtpSecure,
        emailFrom: data.emailFrom,
        emailFromName: data.emailFromName,
        emailEnabled: data.emailEnabled,
        tlsRejectUnauthorized: data.tlsRejectUnauthorized,
        updatedAt: new Date(),
      };

      if (existing) {
        await db
          .update(emailSettings)
          .set(settingsData)
          .where(eq(emailSettings.id, existing.id));
      } else {
        if (provider === 'smtp' && !data.smtpPassword) {
          return { error: 'SMTP password is required for new settings' };
        }
        if (provider === 'mailtrap_api' && !data.apiToken) {
          return { error: 'API token is required for new settings' };
        }
        await db.insert(emailSettings).values(settingsData);
      }

      clearEmailSettingsCache();
      revalidatePath('/settings/email');
      return { success: 'Email settings saved successfully' };
    } catch (error) {
      console.error('[EmailSettings] Error updating settings:', error);
      return { error: 'Failed to save email settings' };
    }
  }
);

const testEmailSchema = z.object({
  testEmail: z.string().email('Invalid email address'),
});

/**
 * Send a test email to verify configuration
 */
export const sendTestEmailAction = validatedActionWithUser(
  testEmailSchema,
  async (data, _, user) => {
    try {
      const { sendTestEmail } = await import('./utils');
      const result = await sendTestEmail(data.testEmail);

      if (!result.success) {
        return { error: result.error || 'Failed to send test email' };
      }

      return { success: `Test email sent successfully to ${data.testEmail}` };
    } catch (error) {
      console.error('[EmailSettings] Error sending test email:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to send test email',
      };
    }
  }
);
