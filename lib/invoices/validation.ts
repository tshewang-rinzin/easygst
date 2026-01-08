import { z } from 'zod';
import { booleanCoerce } from '@/lib/validation-helpers';

// Invoice item validation schema
export const invoiceItemSchema = z.object({
  productId: z.coerce.number().optional(),
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

export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;

// Invoice validation schema
export const invoiceSchema = z.object({
  customerId: z.coerce.number().min(1, 'Customer is required'),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
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
    .pipe(z.array(invoiceItemSchema).min(1, 'At least one invoice item is required')),
  paymentTerms: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  customerNotes: z.string().max(1000).optional().or(z.literal('')),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Update invoice schema (includes ID)
export const updateInvoiceSchema = invoiceSchema.extend({
  id: z.coerce.number(),
});

// Delete invoice schema
export const deleteInvoiceSchema = z.object({
  id: z.coerce.number(),
});

// Send invoice schema
export const sendInvoiceSchema = z.object({
  id: z.coerce.number(),
  channels: z.object({
    email: booleanCoerce(false),
    whatsapp: booleanCoerce(false),
    sms: booleanCoerce(false),
  }),
});

// Lock/unlock invoice schema
export const lockInvoiceSchema = z.object({
  id: z.coerce.number(),
});

// Update invoice status schema
export const updateInvoiceStatusSchema = z.object({
  id: z.coerce.number(),
  status: z.enum([
    'draft',
    'sent',
    'viewed',
    'paid',
    'overdue',
    'cancelled',
  ]),
});
