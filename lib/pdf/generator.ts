import { renderToStream } from '@react-pdf/renderer';
import { InvoiceTemplate } from './templates/invoice-template';
import React from 'react';
import QRCode from 'qrcode';

interface InvoiceData {
  // Business Info
  businessName: string;
  logoUrl?: string | null;
  tpn?: string | null;
  gstNumber?: string | null;
  licenseNumber?: string | null;
  address?: string | null;
  city?: string | null;
  dzongkhag?: string | null;
  // Legacy bank fields (deprecated)
  bankName?: string | null;
  bankAccountNumber?: string | null;
  // Bank Accounts (new)
  bankAccounts?: Array<{
    id: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    paymentMethod: string;
    isDefault: boolean;
  }>;

  // Invoice Info
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date | null;
  status: string;
  currency: string;
  publicId?: string | null;

  // Customer Info
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    tpn?: string | null;
  };

  // Line Items
  items: Array<{
    description: string;
    quantity: string;
    unit?: string | null;
    unitPrice: string;
    taxRate: string;
    taxAmount: string;
    isTaxExempt: boolean;
    gstClassification?: string | null;
    itemTotal: string;
  }>;

  // Totals
  subtotal: string;
  totalDiscount: string;
  totalTax: string;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;

  // Notes
  paymentTerms?: string | null;
  customerNotes?: string | null;
  termsAndConditions?: string | null;

  // Verification
  verificationUrl?: string | null;
}

/**
 * Generate a QR code data URL for the verification URL
 */
async function generateQRCodeDataUrl(url: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 150,
      margin: 1,
      color: {
        dark: '#1f2937',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}

/**
 * Generate a PDF invoice as a readable stream
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<NodeJS.ReadableStream> {
  // Generate QR code if verification URL is provided
  let qrCodeDataUrl: string | null = null;
  if (data.verificationUrl) {
    qrCodeDataUrl = await generateQRCodeDataUrl(data.verificationUrl);
  }

  const templateData = {
    ...data,
    qrCodeDataUrl,
  };

  const document = React.createElement(InvoiceTemplate, { data: templateData }) as any;
  const stream = await renderToStream(document);
  return stream;
}

/**
 * Get the filename for an invoice PDF
 */
export function getInvoicePDFFilename(invoiceNumber: string): string {
  return `Invoice-${invoiceNumber}.pdf`;
}
