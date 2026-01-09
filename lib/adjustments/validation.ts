import { z } from 'zod';

// Adjustment types
export const adjustmentTypes = [
  { value: 'credit_note', label: 'Credit Note' },
  { value: 'debit_note', label: 'Debit Note' },
  { value: 'discount', label: 'Discount' },
  { value: 'late_fee', label: 'Late Fee' },
  { value: 'bank_charges', label: 'Bank Charges' },
  { value: 'other', label: 'Other' },
] as const;

export const adjustmentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required').transform(Number),
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
  amount: z.string().min(1, 'Amount is required').transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) {
      throw new Error('Amount must be a non-zero number');
    }
    return num.toString();
  }),
  description: z.string().min(1, 'Description is required').max(500),
  referenceNumber: z.string().optional(),
  adjustmentDate: z.string().min(1, 'Adjustment date is required'),
  notes: z.string().optional(),
});

export type AdjustmentFormData = z.infer<typeof adjustmentSchema>;
