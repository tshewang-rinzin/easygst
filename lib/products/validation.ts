import { z } from 'zod';
import { booleanCoerce } from '@/lib/validation-helpers';

// Product validation schema
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().max(1000).optional(),
  sku: z.string().max(100).optional(),
  unit: z.string().max(50).default('piece'),
  productType: z.enum(['product', 'service']).default('product'),
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
  trackInventory: booleanCoerce(false),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  isActive: booleanCoerce(true),
  // Variant pass-through fields (used during creation)
  hasVariants: booleanCoerce(false),
  variantAttributes: z.string().optional(),
  variantData: z.string().optional(),
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

// Attribute definition schema
export const attributeDefinitionSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1, 'Attribute name is required').max(100),
  values: z.array(z.string().min(1)).min(1, 'At least one value is required'),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

// Variant schema
export const variantSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(255),
  sku: z.string().max(100).optional(),
  attributeValues: z.record(z.string()),
  unitPrice: z.coerce.number().min(0).optional().nullable(),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(0),
  isActive: booleanCoerce(true),
});

// Bulk variant save schema
export const saveVariantsSchema = z.object({
  productId: z.string().uuid(),
  attributes: z.array(z.object({
    name: z.string().min(1),
    values: z.array(z.string().min(1)).min(1),
  })),
  variants: z.array(z.object({
    name: z.string().min(1),
    sku: z.string().max(100).optional(),
    attributeValues: z.record(z.string()),
    unitPrice: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
      z.number().min(0).nullable()
    ),
    costPrice: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
      z.number().min(0).nullable()
    ),
    stockQuantity: z.coerce.number().int().min(0).default(0),
    lowStockThreshold: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  })),
});
