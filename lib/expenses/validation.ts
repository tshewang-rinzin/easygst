import { z } from 'zod';

export const createExpenseSchema = z.object({
  expenseCategoryId: z.string().uuid('Category is required'),
  supplierId: z.string().uuid().optional().or(z.literal('')),
  expenseDate: z.coerce.date(),
  description: z.string().min(1, 'Description is required').max(500),
  referenceNumber: z.string().max(100).optional().or(z.literal('')),
  currency: z.enum(['BTN', 'INR', 'USD']).default('BTN'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0').max(9999999999999.99),
  gstRate: z.coerce.number().min(0).max(100).default(0),
  paymentMethod: z.string().max(50).optional().or(z.literal('')),
  paymentDate: z.coerce.date().optional().or(z.literal('')),
  isPaid: z.coerce.boolean().default(false),
  paidFromAccount: z.string().max(100).optional().or(z.literal('')),
  isRecurring: z.coerce.boolean().default(false),
  recurringFrequency: z.string().max(20).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export const updateExpenseSchema = createExpenseSchema.extend({
  id: z.string().uuid(),
});

export const deleteExpenseSchema = z.object({
  id: z.string().uuid(),
});

export const approveExpenseSchema = z.object({
  id: z.string().uuid(),
});

export const voidExpenseSchema = z.object({
  id: z.string().uuid(),
});

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20),
  description: z.string().max(500).optional().or(z.literal('')),
  gstClaimable: z.enum(['full', 'partial', 'none']).default('full'),
  defaultGstRate: z.coerce.number().min(0).max(100).default(0),
  claimablePercentage: z.coerce.number().min(0).max(100).default(100),
  accountCode: z.string().max(20).optional().or(z.literal('')),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.extend({
  id: z.string().uuid(),
});

export const deleteExpenseCategorySchema = z.object({
  id: z.string().uuid(),
});
