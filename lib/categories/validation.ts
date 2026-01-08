import { z } from 'zod';
import { booleanCoerce } from '@/lib/validation-helpers';

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
  isActive: booleanCoerce(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
