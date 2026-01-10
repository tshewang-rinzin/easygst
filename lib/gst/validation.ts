import { z } from 'zod';

export const createGstReturnSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  returnType: z.enum(['monthly', 'quarterly', 'annual']),
  notes: z.string().optional(),
});

export const fileGstReturnSchema = z.object({
  returnId: z.string().uuid(),
  filingDate: z.coerce.date(),
  adjustments: z.coerce.number().default(0),
  previousPeriodBalance: z.coerce.number().default(0),
  penalties: z.coerce.number().default(0),
  interest: z.coerce.number().default(0),
  notes: z.string().optional(),
});

export const createPeriodLockSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  periodType: z.enum(['monthly', 'quarterly', 'annual']),
  reason: z.string().optional(),
  gstReturnId: z.string().uuid().optional(),
});

export const amendGstReturnSchema = z.object({
  returnId: z.string().uuid(),
  adjustments: z.coerce.number(),
  reason: z.string().min(1, 'Amendment reason is required'),
});

export type CreateGstReturnInput = z.infer<typeof createGstReturnSchema>;
export type FileGstReturnInput = z.infer<typeof fileGstReturnSchema>;
export type CreatePeriodLockInput = z.infer<typeof createPeriodLockSchema>;
export type AmendGstReturnInput = z.infer<typeof amendGstReturnSchema>;
