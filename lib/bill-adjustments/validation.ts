import { z } from 'zod';

// Adjustment types
export const billAdjustmentTypes = [
  { value: 'credit_note', label: 'Credit Note' },
  { value: 'debit_note', label: 'Debit Note' },
  { value: 'discount', label: 'Discount' },
  { value: 'late_fee', label: 'Late Fee' },
  { value: 'bank_charges', label: 'Bank Charges' },
  { value: 'other', label: 'Other' },
] as const;

export const billAdjustmentSchema = z.object({
  billId: z.string().uuid('Bill is required'),
  adjustmentType: z.enum([
    'credit_note',
    'debit_note',
    'discount',
    'late_fee',
    'bank_charges',
    'other',
  ], {
    required_error: 'Adjustment type is required',
  }),
  amount: z.coerce
    .number()
    .refine((val) => val !== 0, 'Amount cannot be zero'),
  description: z.string().min(1, 'Description is required').max(500),
  referenceNumber: z.string().max(100).optional().or(z.literal('')),
  adjustmentDate: z.coerce.date(),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export type BillAdjustmentFormData = z.infer<typeof billAdjustmentSchema>;

// For delete operations
export const deleteBillAdjustmentSchema = z.object({
  id: z.string().uuid(),
});
