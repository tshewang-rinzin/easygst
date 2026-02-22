export interface InvoiceData {
  // Business Info
  businessName: string;
  logoUrl?: string | null;
  tpn?: string | null;
  gstNumber?: string | null;
  licenseNumber?: string | null;
  address?: string | null;
  city?: string | null;
  dzongkhag?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccounts?: Array<{
    id: string;
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

  // QR Code
  qrCodeDataUrl?: string | null;
  verificationUrl?: string | null;
}

export interface InvoiceTemplateProps {
  data: InvoiceData;
  accentColor?: string;
}
