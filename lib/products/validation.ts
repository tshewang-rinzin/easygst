import { z } from 'zod';
import { booleanCoerce } from '@/lib/validation-helpers';

// Product validation schema
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().max(1000).optional(),
  sku: z.string().max(100).optional(),
  unit: z.string().max(50).default('piece'),
  unitPrice: z.coerce
    .number()
    .min(0, 'Price cannot be negative')
    .max(9999999999999.99, 'Price is too large'),
  defaultTaxRate: z.coerce
    .number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .default(0),
  isTaxExempt: booleanCoerce(false),
  gstClassification: z.enum(['STANDARD', 'ZERO_RATED', 'EXEMPT']).default('STANDARD'),
  categoryId: z.preprocess(
    (val) => (val === '' || val === 'manual' ? undefined : val),
    z.string().uuid().optional()
  ),
  category: z.string().max(100).optional(),
  isActive: booleanCoerce(true),
});

export type ProductFormData = z.infer<typeof productSchema>;

// For update operations (includes ID)
export const updateProductSchema = productSchema.extend({
  id: z.string().uuid(),
});

// For delete operations
export const deleteProductSchema = z.object({
  id: z.string().uuid(),
});
