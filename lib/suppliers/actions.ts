'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  supplierSchema,
  updateSupplierSchema,
  deleteSupplierSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import { suppliers, activityLogs, ActivityType } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Create a new supplier
 */
export const createSupplier = validatedActionWithUser(
  supplierSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [supplier] = await db
        .insert(suppliers)
        .values({
          ...data,
          teamId: team.id,
          createdBy: user.id,
          email: data.email || null,
          phone: data.phone || null,
          mobile: data.mobile || null,
          tpn: data.tpn || null,
          gstNumber: data.gstNumber || null,
          address: data.address || null,
          city: data.city || null,
          dzongkhag: data.dzongkhag || null,
          postalCode: data.postalCode || null,
          contactPerson: data.contactPerson || null,
          bankName: data.bankName || null,
          bankAccountNumber: data.bankAccountNumber || null,
          bankAccountName: data.bankAccountName || null,
          notes: data.notes || null,
        })
        .returning();

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `CREATE_SUPPLIER: ${supplier.name}`,
        timestamp: new Date(),
      });

      revalidatePath('/suppliers');
      return {
        success: 'Supplier created successfully',
        supplierId: supplier.id,
      };
    } catch (error) {
      console.error('Error creating supplier:', error);
      return { error: 'Failed to create supplier' };
    }
  }
);

/**
 * Update an existing supplier
 */
export const updateSupplier = validatedActionWithUser(
  updateSupplierSchema,
  async (data, _, user) => {
    try {
      const { id, ...updateData } = data;
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      await db
        .update(suppliers)
        .set({
          ...updateData,
          email: updateData.email || null,
          phone: updateData.phone || null,
          mobile: updateData.mobile || null,
          tpn: updateData.tpn || null,
          gstNumber: updateData.gstNumber || null,
          address: updateData.address || null,
          city: updateData.city || null,
          dzongkhag: updateData.dzongkhag || null,
          postalCode: updateData.postalCode || null,
          contactPerson: updateData.contactPerson || null,
          bankName: updateData.bankName || null,
          bankAccountNumber: updateData.bankAccountNumber || null,
          bankAccountName: updateData.bankAccountName || null,
          notes: updateData.notes || null,
          updatedAt: new Date(),
        })
        .where(and(eq(suppliers.id, id), eq(suppliers.teamId, team.id)));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `UPDATE_SUPPLIER: ${updateData.name}`,
        timestamp: new Date(),
      });

      revalidatePath('/suppliers');
      revalidatePath(`/suppliers/${id}`);
      return { success: 'Supplier updated successfully' };
    } catch (error) {
      console.error('Error updating supplier:', error);
      return { error: 'Failed to update supplier' };
    }
  }
);

/**
 * Delete a supplier
 */
export const deleteSupplier = validatedActionWithUser(
  deleteSupplierSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Get supplier name for activity log
      const [supplier] = await db
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.id, data.id), eq(suppliers.teamId, team.id)))
        .limit(1);

      if (!supplier) {
        return { error: 'Supplier not found' };
      }

      // Soft delete by setting isActive to false
      await db
        .update(suppliers)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(eq(suppliers.id, data.id), eq(suppliers.teamId, team.id)));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `DELETE_SUPPLIER: ${supplier.name}`,
        timestamp: new Date(),
      });

      revalidatePath('/suppliers');
      return { success: 'Supplier deleted successfully' };
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return { error: 'Failed to delete supplier' };
    }
  }
);
