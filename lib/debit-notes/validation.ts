import { z } from 'zod';

// Debit note item validation
export const debitNoteItemSchema = z.object({
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

export type DebitNoteItemFormData = z.infer<typeof debitNoteItemSchema>;

// Debit note validation
export const debitNoteSchema = z.object({
  supplierId: z.string().uuid('Supplier is required'),
  billId: z.string().uuid().optional().nullable(),
  debitNoteDate: z.coerce.date(),
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
    .pipe(z.array(debitNoteItemSchema).min(1, 'At least one item is required')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  supplierNotes: z.string().max(1000).optional().or(z.literal('')),
});

export type DebitNoteFormData = z.infer<typeof debitNoteSchema>;

// Update debit note schema
export const updateDebitNoteSchema = debitNoteSchema.extend({
  id: z.string().uuid(),
});

// Delete debit note schema
export const deleteDebitNoteSchema = z.object({
  id: z.string().uuid(),
});

// Issue debit note schema
export const issueDebitNoteSchema = z.object({
  id: z.string().uuid(),
});

// Apply debit note to bill schema
export const applyDebitNoteSchema = z.object({
  debitNoteId: z.string().uuid(),
  billId: z.string().uuid(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
});
