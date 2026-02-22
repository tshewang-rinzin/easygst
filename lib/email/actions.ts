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
import nodemailer from 'nodemailer';
import { getEmailSettings } from './queries';
import { clearEmailSettingsCache } from './client';
import { encrypt, decrypt, isEncrypted } from '@/lib/auth/crypto';

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
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpUser: z.string().min(1, 'SMTP user is required'),
  smtpPassword: z.string().optional(), // Optional to allow keeping existing password
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
      // Check if settings already exist
      const existing = await getEmailSettings();

      // Determine password: use new if provided, otherwise keep existing
      let passwordToUse = data.smtpPassword && data.smtpPassword.length > 0
        ? encrypt(data.smtpPassword)
        : existing?.smtpPassword;

      // Validate that we have a password (new or existing)
      if (!passwordToUse && data.emailEnabled) {
        return { error: 'SMTP password is required when email is enabled' };
      }

      if (existing) {
        // Update existing settings
        await db
          .update(emailSettings)
          .set({
            smtpHost: data.smtpHost,
            smtpPort: data.smtpPort,
            smtpUser: data.smtpUser,
            smtpPassword: passwordToUse || '',
            smtpSecure: data.smtpSecure,
            emailFrom: data.emailFrom,
            emailFromName: data.emailFromName,
            emailEnabled: data.emailEnabled,
            tlsRejectUnauthorized: data.tlsRejectUnauthorized,
            updatedAt: new Date(),
          })
          .where(eq(emailSettings.id, existing.id));
      } else {
        // For new settings, password is required
        if (!data.smtpPassword) {
          return { error: 'SMTP password is required' };
        }

        // Create new settings with encrypted password
        await db.insert(emailSettings).values({
          smtpHost: data.smtpHost,
          smtpPort: data.smtpPort,
          smtpUser: data.smtpUser,
          smtpPassword: encrypt(data.smtpPassword),
          smtpSecure: data.smtpSecure,
          emailFrom: data.emailFrom,
          emailFromName: data.emailFromName,
          emailEnabled: data.emailEnabled,
          tlsRejectUnauthorized: data.tlsRejectUnauthorized,
        });
      }

      // Clear the cache so new settings take effect immediately
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
      // Get settings from database first, then fall back to env
      const dbSettings = await getEmailSettings();

      let smtpHost: string | undefined;
      let smtpPort: number | undefined;
      let smtpUser: string | undefined;
      let smtpPassword: string | undefined;
      let emailFrom: string | undefined;
      let emailFromName: string | undefined;
      let emailEnabled: boolean = false;
      let tlsRejectUnauthorized: boolean = true;

      if (dbSettings && dbSettings.emailEnabled) {
        smtpHost = dbSettings.smtpHost || undefined;
        smtpPort = dbSettings.smtpPort || undefined;
        smtpUser = dbSettings.smtpUser || undefined;
        // Decrypt SMTP password if encrypted
        const rawPassword = dbSettings.smtpPassword || undefined;
        smtpPassword = rawPassword && isEncrypted(rawPassword) ? decrypt(rawPassword) : rawPassword;
        emailFrom = dbSettings.emailFrom || undefined;
        emailFromName = dbSettings.emailFromName || undefined;
        emailEnabled = dbSettings.emailEnabled;
        tlsRejectUnauthorized = dbSettings.tlsRejectUnauthorized ?? true;
      } else {
        // Fall back to environment variables
        smtpHost = process.env.SMTP_HOST;
        smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
        smtpUser = process.env.SMTP_USER;
        smtpPassword = process.env.SMTP_PASSWORD;
        emailFrom = process.env.EMAIL_FROM;
        emailFromName = process.env.EMAIL_FROM_NAME || 'EasyGST';
        emailEnabled = process.env.EMAIL_ENABLED === 'true';
        tlsRejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';
      }

      if (!emailEnabled) {
        return { error: 'Email is not enabled. Please enable email delivery first.' };
      }

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !emailFrom) {
        return { error: 'SMTP configuration is incomplete' };
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        tls: {
          rejectUnauthorized: tlsRejectUnauthorized,
        },
      });

      // Send test email
      const info = await transporter.sendMail({
        from: {
          name: emailFromName || 'EasyGST',
          address: emailFrom,
        },
        to: data.testEmail,
        subject: 'Test Email from EasyGST',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">✓ Email Configuration Working!</h1>
            <p>This is a test email from EasyGST to verify your SMTP configuration.</p>
            <p>If you received this email, your email settings are configured correctly.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 12px;">
              Sent from EasyGST at ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      });

      return { success: `Test email sent successfully to ${data.testEmail}` };
    } catch (error) {
      console.error('[EmailSettings] Error sending test email:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to send test email',
      };
    }
  }
);
