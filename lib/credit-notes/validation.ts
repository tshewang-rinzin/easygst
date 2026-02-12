import { z } from 'zod';

// Credit note item validation
export const creditNoteItemSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().max(50).optional(),
  unitPrice: z.coerce
    .number()
    .min(0, 'Unit price cannot be negative')
    .max(9999999999999.99, 'Unit price is too large'),
  taxRate: z.coerce
    .number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .default(0),
  gstClassification: z.string().default('STANDARD'),
});

export type CreditNoteItemFormData = z.infer<typeof creditNoteItemSchema>;

// Credit note validation
export const creditNoteSchema = z.object({
  customerId: z.string().uuid('Customer is required'),
  invoiceId: z.string().uuid().optional().nullable(),
  creditNoteDate: z.coerce.date(),
  currency: z.enum(['BTN', 'INR', 'USD']).default('BTN'),
  reason: z.string().min(1, 'Reason is required').max(1000),
  items: z
    .string()
    .transform((str) => {
      try {
        return JSON.parse(str);
      } catch {
        return [];
      }
    })
    .pipe(z.array(creditNoteItemSchema).min(1, 'At least one item is required')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  customerNotes: z.string().max(1000).optional().or(z.literal('')),
});

export type CreditNoteFormData = z.infer<typeof creditNoteSchema>;

// Update credit note schema
export const updateCreditNoteSchema = creditNoteSchema.extend({
  id: z.string().uuid(),
});

// Delete credit note schema
export const deleteCreditNoteSchema = z.object({
  id: z.string().uuid(),
});

// Issue credit note schema
export const issueCreditNoteSchema = z.object({
  id: z.string().uuid(),
});

// Apply credit note to invoice schema
export const applyCreditNoteSchema = z.object({
  creditNoteId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
});
