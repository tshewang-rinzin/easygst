import { z } from 'zod';

// Supplier payment validation
export const supplierPaymentSchema = z.object({
  billId: z.coerce.number().min(1, 'Bill is required'),
  amount: z.coerce
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .max(9999999999999.99, 'Amount is too large'),
  currency: z.enum(['BTN', 'INR', 'USD']).default('BTN'),
  paymentDate: z.coerce.date(),
  paymentMethod: z.string().min(1, 'Payment method is required').max(50),
  paymentGateway: z.string().max(100).optional().or(z.literal('')),
  bankName: z.string().max(255).optional().or(z.literal('')),
  chequeNumber: z.string().max(50).optional().or(z.literal('')),
  transactionId: z.string().max(255).optional().or(z.literal('')),
  receiptNumber: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export type SupplierPaymentFormData = z.infer<typeof supplierPaymentSchema>;

// For delete operations
export const deleteSupplierPaymentSchema = z.object({
  id: z.coerce.number(),
});

// ============================================================
// SUPPLIER ADVANCE SCHEMAS
// ============================================================

export const supplierAdvanceSchema = z.object({
  supplierId: z.coerce.number().min(1, 'Supplier is required'),
  amount: z.coerce
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .max(9999999999999.99, 'Amount is too large'),
  currency: z.enum(['BTN', 'INR', 'USD']).default('BTN'),
  paymentDate: z.coerce.date(),
  paymentMethod: z.string().min(1, 'Payment method is required').max(50),
  paymentGateway: z.string().max(100).optional().or(z.literal('')),
  bankName: z.string().max(255).optional().or(z.literal('')),
  chequeNumber: z.string().max(50).optional().or(z.literal('')),
  transactionId: z.string().max(255).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const allocateSupplierAdvanceSchema = z.object({
  advanceId: z.coerce.number().min(1, 'Advance ID is required'),
  allocations: z.union([
    z.string().transform((str) => {
      try {
        return JSON.parse(str);
      } catch {
        throw new Error('Invalid allocations format');
      }
    }),
    z.array(
      z.object({
        billId: z.coerce.number().min(1),
        allocatedAmount: z.coerce.number().min(0.01),
      })
    ),
  ]).pipe(
    z.array(
      z.object({
        billId: z.coerce.number().min(1),
        allocatedAmount: z.coerce.number().min(0.01),
      })
    ).min(1, 'At least one bill allocation is required')
  ),
});

export const deleteSupplierAdvanceSchema = z.object({
  id: z.coerce.number().min(1, 'Advance ID is required'),
});

export type SupplierAdvanceFormData = z.infer<typeof supplierAdvanceSchema>;
export type AllocateSupplierAdvanceFormData = z.infer<typeof allocateSupplierAdvanceSchema>;
export type DeleteSupplierAdvanceFormData = z.infer<typeof deleteSupplierAdvanceSchema>;
