'use server';

import { sendEmail, isValidEmail } from './utils';
import InvoiceEmail from './templates/invoice-email';
import PaymentReceiptEmail from './templates/payment-receipt-email';
import PaymentReminderEmail from './templates/payment-reminder-email';
import { db } from '@/lib/db/drizzle';
import { invoices, invoiceItems, customers, customerPayments, teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Send invoice email to customer
 */
export async function sendInvoiceEmail(
  invoiceId: number
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
  paymentId: number
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
  invoiceId: number
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
