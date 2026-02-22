/**
 * SMS/WhatsApp message templates for invoices, receipts, reminders, and quotations.
 * Keep messages short and professional — SMS has 160 char limit per segment.
 */

export function invoiceMessage(data: {
  businessName: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: string;
  dueDate: string;
  paymentLink?: string;
}): string {
  let msg = `${data.businessName}\nInvoice #${data.invoiceNumber}\nDear ${data.customerName},\nAmount: BTN ${data.totalAmount}\nDue: ${data.dueDate}`;
  if (data.paymentLink) {
    msg += `\nPay: ${data.paymentLink}`;
  }
  msg += '\nThank you!';
  return msg;
}

export function receiptMessage(data: {
  businessName: string;
  receiptNumber: string;
  totalAmount: string;
  paymentMethod: string;
}): string {
  return `${data.businessName}\nReceipt #${data.receiptNumber}\nAmount: BTN ${data.totalAmount}\nPaid via: ${data.paymentMethod}\nThank you for your payment!`;
}

export function paymentReminderMessage(data: {
  businessName: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: string;
  dueDate: string;
  daysOverdue: number;
}): string {
  return `${data.businessName}\nPayment Reminder\nDear ${data.customerName},\nInvoice #${data.invoiceNumber} for BTN ${data.totalAmount} was due on ${data.dueDate} (${data.daysOverdue} days overdue).\nPlease arrange payment at your earliest convenience.\nThank you!`;
}

export function quotationMessage(data: {
  businessName: string;
  quotationNumber: string;
  customerName: string;
  totalAmount: string;
  validUntil: string;
}): string {
  return `${data.businessName}\nQuotation #${data.quotationNumber}\nDear ${data.customerName},\nTotal: BTN ${data.totalAmount}\nValid until: ${data.validUntil}\nPlease contact us to proceed.\nThank you!`;
}
