import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().uuid().optional()
  ),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(1, 'Reason is required').max(255),
  referenceType: z.enum(['manual', 'purchase', 'return']).default('manual'),
  notes: z.string().max(1000).optional(),
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;
