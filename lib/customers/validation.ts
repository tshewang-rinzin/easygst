import { z } from 'zod';
import { booleanCoerce } from '@/lib/validation-helpers';

// Customer validation schema
export const customerSchema = z.object({
  customerType: z.enum(['individual', 'business', 'government']).default('business'),
  name: z.string().min(1, 'Customer name is required').max(255),
  contactPerson: z.string().max(255).optional(),
  department: z.string().max(255).optional(),
  cidNumber: z.string().max(20).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  mobile: z.string().max(20).optional(),
  tpn: z
    .string()
    .max(20, 'TPN is too long')
    .optional()
    .or(z.literal('')),
  address: z.string().max(1000).optional(),
  city: z.string().max(100).optional(),
  dzongkhag: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  notes: z.string().max(5000).optional(),
  isActive: booleanCoerce(true),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

// For update operations (includes ID)
export const updateCustomerSchema = customerSchema.extend({
  id: z.string().uuid(),
});

// For delete operations
export const deleteCustomerSchema = z.object({
  id: z.string().uuid(),
});
