import { z } from 'zod';

export const customerPaymentSchema = z.object({
  customerId: z.coerce.number().min(1, 'Customer is required'),
  amount: z.coerce.number().min(0.01).max(9999999999999.99, 'Amount must be valid'),
  currency: z.enum(['BTN', 'INR', 'USD']).default('BTN'),
  paymentDate: z.coerce.date(),
  paymentMethod: z.string().min(1, 'Payment method is required').max(50),
  paymentGateway: z.string().max(100).optional().or(z.literal('')),
  bankName: z.string().max(255).optional().or(z.literal('')),
  chequeNumber: z.string().max(50).optional().or(z.literal('')),
  transactionId: z.string().max(255).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  // Invoice allocations - can be a JSON string or array
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
        invoiceId: z.coerce.number().min(1),
        allocatedAmount: z.coerce.number().min(0.01),
      })
    ),
  ]).pipe(
    z.array(
      z.object({
        invoiceId: z.coerce.number().min(1),
        allocatedAmount: z.coerce.number().min(0.01),
      })
    ).min(1, 'At least one invoice allocation is required')
  ),
});

export const deleteCustomerPaymentSchema = z.object({
  id: z.coerce.number().min(1, 'Payment ID is required'),
});

// Customer Advance Schemas
export const customerAdvanceSchema = z.object({
  customerId: z.coerce.number().min(1, 'Customer is required'),
  amount: z.coerce.number().min(0.01).max(9999999999999.99, 'Amount must be valid'),
  currency: z.enum(['BTN', 'INR', 'USD']).default('BTN'),
  paymentDate: z.coerce.date(),
  paymentMethod: z.string().min(1, 'Payment method is required').max(50),
  paymentGateway: z.string().max(100).optional().or(z.literal('')),
  bankName: z.string().max(255).optional().or(z.literal('')),
  chequeNumber: z.string().max(50).optional().or(z.literal('')),
  transactionId: z.string().max(255).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export const allocateCustomerAdvanceSchema = z.object({
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
        invoiceId: z.coerce.number().min(1),
        allocatedAmount: z.coerce.number().min(0.01),
      })
    ),
  ]).pipe(
    z.array(
      z.object({
        invoiceId: z.coerce.number().min(1),
        allocatedAmount: z.coerce.number().min(0.01),
      })
    ).min(1, 'At least one invoice allocation is required')
  ),
});

export const deleteCustomerAdvanceSchema = z.object({
  id: z.coerce.number().min(1, 'Advance ID is required'),
});

export type CustomerPaymentFormData = z.infer<typeof customerPaymentSchema>;
export type DeleteCustomerPaymentFormData = z.infer<typeof deleteCustomerPaymentSchema>;
export type CustomerAdvanceFormData = z.infer<typeof customerAdvanceSchema>;
export type AllocateCustomerAdvanceFormData = z.infer<typeof allocateCustomerAdvanceSchema>;
export type DeleteCustomerAdvanceFormData = z.infer<typeof deleteCustomerAdvanceSchema>;
