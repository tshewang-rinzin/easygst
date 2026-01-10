import { z } from 'zod';
import { booleanCoerce } from '@/lib/validation-helpers';

// Supplier validation schema
export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(255),
  contactPerson: z.string().max(255).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  mobile: z.string().max(20).optional().or(z.literal('')),
  tpn: z.string().max(20).optional().or(z.literal('')),
  gstNumber: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(1000).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  dzongkhag: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(10).optional().or(z.literal('')),
  bankName: z.string().max(100).optional().or(z.literal('')),
  bankAccountNumber: z.string().max(50).optional().or(z.literal('')),
  bankAccountName: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
  isActive: booleanCoerce(true),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// For update operations (includes ID)
export const updateSupplierSchema = supplierSchema.extend({
  id: z.string().uuid(),
});

// For delete operations
export const deleteSupplierSchema = z.object({
  id: z.string().uuid(),
});
