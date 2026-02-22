import { z } from 'zod';
import { booleanCoerce } from '@/lib/validation-helpers';

export const quotationItemSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().max(50).default('piece'),
  unitPrice: z.coerce
    .number()
    .min(0, 'Unit price cannot be negative')
    .max(9999999999999.99, 'Unit price is too large'),
  discountPercent: z.coerce
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .default(0),
  taxRate: z.coerce
    .number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .default(0),
  isTaxExempt: booleanCoerce(false),
});

export const createQuotationSchema = z.object({
  customerId: z.string().uuid('Customer is required'),
  quotationDate: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  currency: z.enum(['BTN', 'INR', 'USD']).default('BTN'),
  items: z
    .string()
    .transform((str) => {
      try {
        return JSON.parse(str);
      } catch {
        return [];
      }
    })
    .pipe(z.array(quotationItemSchema).min(1, 'At least one item is required')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  customerNotes: z.string().max(1000).optional().or(z.literal('')),
  termsAndConditions: z.string().max(5000).optional().or(z.literal('')),
});

export const updateQuotationSchema = createQuotationSchema.extend({
  id: z.string().uuid(),
});

export const deleteQuotationSchema = z.object({
  id: z.string().uuid(),
});

export const updateQuotationStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['sent', 'accepted', 'rejected', 'expired']),
});

export const convertToInvoiceSchema = z.object({
  quotationId: z.string().uuid(),
});
