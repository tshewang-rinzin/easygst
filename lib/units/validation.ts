import { z } from 'zod';

export const unitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  abbreviation: z.string().min(1, 'Abbreviation is required').max(20),
  description: z.string().max(500).optional().or(z.literal('')),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateUnitSchema = unitSchema.extend({
  id: z.coerce.number(),
});

export const deleteUnitSchema = z.object({
  id: z.coerce.number(),
});
