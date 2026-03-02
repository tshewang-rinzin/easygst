import { z } from 'zod';

// Business Type Validation
export const businessTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be 100 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateBusinessTypeSchema = businessTypeSchema.extend({
  id: z.string().uuid(),
});

export const deleteBusinessTypeSchema = z.object({
  id: z.string().uuid(),
});

// Master Product Category Validation
export const masterProductCategorySchema = z.object({
  businessTypeId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be 100 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateMasterProductCategorySchema = masterProductCategorySchema.extend({
  id: z.string().uuid(),
});

export const deleteMasterProductCategorySchema = z.object({
  id: z.string().uuid(),
});

// Master Product Validation
export const masterProductSchema = z.object({
  businessTypeId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  description: z.string().optional(),
  defaultSku: z.string().max(100, 'SKU must be 100 characters or less').optional(),
  defaultBarcode: z.string().max(100, 'Barcode must be 100 characters or less').optional(),
  defaultUnit: z.string().min(1, 'Unit is required').max(50, 'Unit must be 50 characters or less').default('piece'),
  defaultGstRate: z.number().min(0, 'GST rate must be positive').max(100, 'GST rate cannot exceed 100%').default(0),
  defaultTaxClassification: z.enum(['STANDARD', 'ZERO_RATED', 'EXEMPT']).default('STANDARD'),
  imageUrl: z.string().url('Invalid image URL').optional(),
  isActive: z.boolean().default(true),
});

export const updateMasterProductSchema = masterProductSchema.extend({
  id: z.string().uuid(),
});

export const deleteMasterProductSchema = z.object({
  id: z.string().uuid(),
});

// CSV Import Validation
export const importMasterProductsSchema = z.object({
  csvData: z.string().min(1, 'CSV data is required'),
  businessTypeId: z.string().uuid(),
});

// Add products to team validation
export const addMasterProductsToTeamSchema = z.object({
  masterProductIds: z.array(z.string().uuid()).min(1, 'At least one product must be selected'),
  products: z.array(z.object({
    masterProductId: z.string().uuid(),
    sellingPrice: z.number().min(0, 'Selling price must be positive'),
    openingStock: z.number().int().min(0, 'Opening stock must be non-negative').default(0),
  })),
});

export type BusinessTypeInput = z.infer<typeof businessTypeSchema>;
export type UpdateBusinessTypeInput = z.infer<typeof updateBusinessTypeSchema>;
export type MasterProductCategoryInput = z.infer<typeof masterProductCategorySchema>;
export type UpdateMasterProductCategoryInput = z.infer<typeof updateMasterProductCategorySchema>;
export type MasterProductInput = z.infer<typeof masterProductSchema>;
export type UpdateMasterProductInput = z.infer<typeof updateMasterProductSchema>;
export type ImportMasterProductsInput = z.infer<typeof importMasterProductsSchema>;
export type AddMasterProductsToTeamInput = z.infer<typeof addMasterProductsToTeamSchema>;