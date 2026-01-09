import { z } from 'zod';

// Payment Method Form Validation Schema
export const paymentMethodSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

// Default Bhutan payment methods
export const DEFAULT_BHUTAN_PAYMENT_METHODS = [
  {
    code: 'cash',
    name: 'Cash',
    description: 'Cash payment',
    isEnabled: true,
    sortOrder: 0,
  },
  {
    code: 'mbob',
    name: 'mBoB',
    description: 'Mobile banking service provided by Bank of Bhutan',
    isEnabled: true,
    sortOrder: 1,
  },
  {
    code: 'mpay',
    name: 'mPay',
    description: 'Mobile banking service provided by Bhutan National Bank',
    isEnabled: true,
    sortOrder: 2,
  },
  {
    code: 'epay',
    name: 'ePay',
    description: 'Mobile banking service provided by Bhutan Development Bank',
    isEnabled: true,
    sortOrder: 3,
  },
  {
    code: 'dk_mobile_bank',
    name: 'DK Mobile Bank',
    description: 'Mobile banking service provided by DK Bank',
    isEnabled: true,
    sortOrder: 4,
  },
  {
    code: 'tpay',
    name: 'tPay',
    description: 'Mobile banking service provided by Tashi Bank',
    isEnabled: true,
    sortOrder: 5,
  },
  {
    code: 'tpay',
    name: 'TPay',
    description: 'Mobile banking service provided by Tashi Bank',
    isEnabled: true,
    sortOrder: 6,
  },
  {
    code: 'drukpay',
    name: 'DrukPay',
    description: 'Mobile banking service provided by Druk Punjab National Bank',
    isEnabled: true,
    sortOrder: 7,
  },
  {
    code: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank-to-bank transfer',
    isEnabled: true,
    sortOrder: 8,
  },
  {
    code: 'cheque',
    name: 'Cheque',
    description: 'Payment by cheque',
    isEnabled: true,
    sortOrder: 9,
  },
  {
    code: 'online_payment',
    name: 'Online Payment',
    description: 'Other online payment methods',
    isEnabled: true,
    sortOrder: 10,
  },
] as const;
