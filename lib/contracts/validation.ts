import { z } from 'zod';

export const contractMilestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required').max(255),
  description: z.string().max(1000).optional(),
  percentage: z.coerce.number().min(0).max(100).optional(),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  dueDate: z.string().optional(), // ISO date string
});

export const contractBillingEntrySchema = z.object({
  periodLabel: z.string().max(100).optional(),
  periodStart: z.string().min(1, 'Period start is required'),
  periodEnd: z.string().min(1, 'Period end is required'),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  dueDate: z.string().optional(),
});

// Helper to parse JSON string fields from FormData
const jsonArrayOrEmpty = (schema: z.ZodType<any>) =>
  z
    .string()
    .optional()
    .transform((str) => {
      if (!str) return [];
      try {
        return JSON.parse(str);
      } catch {
        return [];
      }
    })
    .pipe(z.array(schema));

export const createContractSchema = z.object({
  customerId: z.string().uuid('Invalid customer'),
  type: z.enum(['project', 'amc']),
  name: z.string().min(1, 'Contract name is required').max(255),
  description: z.string().max(2000).optional().transform(v => v === '' ? undefined : v),
  totalValue: z.coerce.number().min(0.01, 'Total value must be greater than 0'),
  currency: z.enum(['BTN', 'INR', 'USD']).default('BTN'),
  gstRate: z.coerce.number().min(0).max(100).default(0),
  isGstInclusive: z.union([z.boolean(), z.string().transform(v => v === 'true')]).default(true),
  startDate: z.string().optional().transform(v => v === '' ? undefined : v),
  endDate: z.string().optional().transform(v => v === '' ? undefined : v),
  billingFrequency: z.union([
    z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom']),
    z.literal(''),
  ]).optional().transform(v => v === '' ? undefined : v),
  notes: z.string().max(2000).optional().transform(v => v === '' ? undefined : v),
  terms: z.string().max(5000).optional().transform(v => v === '' ? undefined : v),
  milestones: jsonArrayOrEmpty(contractMilestoneSchema),
  billingSchedule: jsonArrayOrEmpty(contractBillingEntrySchema),
});

export const updateContractSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  type: z.enum(['project', 'amc']).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  totalValue: z.coerce.number().min(0.01).optional(),
  currency: z.enum(['BTN', 'INR', 'USD']).optional(),
  gstRate: z.coerce.number().min(0).max(100).optional(),
  isGstInclusive: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  billingFrequency: z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom']).optional(),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(5000).optional(),
  milestones: jsonArrayOrEmpty(contractMilestoneSchema).optional(),
  billingSchedule: jsonArrayOrEmpty(contractBillingEntrySchema).optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
