import { z } from 'zod';
import { booleanCoerce } from '@/lib/validation-helpers';

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
  parentId: z.preprocess(
    (val) => (val === '' || val === 'none' ? undefined : val),
    z.string().uuid().optional()
  ),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: booleanCoerce(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
