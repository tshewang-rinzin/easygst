import { z } from 'zod';

// Supplier bill item validation
export const billItemSchema = z.object({
  productId: z.coerce.number().optional(),
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().max(50).default('Piece'),
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
  isTaxExempt: z.boolean().default(false),
  gstClassification: z.string().default('STANDARD'),
});

// Supplier bill validation
export const supplierBillSchema = z.object({
  supplierId: z.coerce.number().min(1, 'Supplier is required'),
  billNumber: z.string().min(1, 'Bill number is required').max(50),
  billDate: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
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
    .pipe(z.array(billItemSchema).min(1, 'At least one item is required')),
  paymentTerms: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  termsAndConditions: z.string().max(1000).optional().or(z.literal('')),
});

export type BillItemFormData = z.infer<typeof billItemSchema>;
export type SupplierBillFormData = z.infer<typeof supplierBillSchema>;

// For update operations
export const updateSupplierBillSchema = supplierBillSchema.extend({
  id: z.coerce.number(),
});

// For delete operations
export const deleteSupplierBillSchema = z.object({
  id: z.coerce.number(),
});
