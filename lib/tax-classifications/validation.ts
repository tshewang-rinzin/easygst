import { z } from 'zod';

export const taxClassificationSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[A-Z_]+$/, 'Code must contain only uppercase letters and underscores'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().or(z.literal('')),
  taxRate: z.coerce
    .number()
    .min(0, 'Tax rate must be at least 0')
    .max(100, 'Tax rate must be at most 100'),
  canClaimInputCredits: z.coerce.boolean().default(true),
  color: z.string().max(50).default('blue'),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0, 'Sort order must be at least 0').default(0),
});

export const updateTaxClassificationSchema = taxClassificationSchema.extend({
  id: z.string().uuid(),
});

export const deleteTaxClassificationSchema = z.object({
  id: z.string().uuid(),
});

export type TaxClassificationInput = z.infer<typeof taxClassificationSchema>;
export type UpdateTaxClassificationInput = z.infer<typeof updateTaxClassificationSchema>;
export type DeleteTaxClassificationInput = z.infer<typeof deleteTaxClassificationSchema>;
