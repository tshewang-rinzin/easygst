import { z } from 'zod';

// Bank Account Form Validation Schema
export const bankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required').max(100),
  accountNumber: z.string().min(1, 'Account number is required').max(50),
  accountName: z.string().min(1, 'Account name is required').max(100),
  branch: z.string().max(100).optional().or(z.literal('')),
  accountType: z.string().max(50).optional().or(z.literal('')),
  paymentMethod: z.string().min(1, 'Payment method is required').max(50),
  qrCodeUrl: z.string().optional().or(z.literal('')),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export type BankAccountFormData = z.infer<typeof bankAccountSchema>;

// Payment method options for Bhutan
export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mbob', label: 'mBoB (Mobile Banking - Bank of Bhutan)' },
  { value: 'mpay', label: 'mPay (BNB Mobile Banking)' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
] as const;

// Account type options
export const ACCOUNT_TYPES = [
  { value: 'savings', label: 'Savings Account' },
  { value: 'current', label: 'Current Account' },
  { value: 'business', label: 'Business Account' },
  { value: 'other', label: 'Other' },
] as const;
