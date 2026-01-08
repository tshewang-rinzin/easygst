'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  customerSchema,
  updateCustomerSchema,
  deleteCustomerSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import { customers, activityLogs, ActivityType } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Create a new customer
 */
export const createCustomer = validatedActionWithUser(
  customerSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [customer] = await db
        .insert(customers)
        .values({
          ...data,
          teamId: team.id,
          createdBy: user.id,
          email: data.email || null,
          phone: data.phone || null,
          mobile: data.mobile || null,
          tpn: data.tpn || null,
          address: data.address || null,
          city: data.city || null,
          dzongkhag: data.dzongkhag || null,
          postalCode: data.postalCode || null,
          contactPerson: data.contactPerson || null,
          notes: data.notes || null,
        })
        .returning();

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.CREATE_CUSTOMER}: ${customer.name}`,
        timestamp: new Date(),
      });

      revalidatePath('/customers');
      return {
        success: 'Customer created successfully',
        customerId: customer.id,
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { error: 'Failed to create customer' };
    }
  }
);

/**
 * Update an existing customer
 */
export const updateCustomer = validatedActionWithUser(
  updateCustomerSchema,
  async (data, _, user) => {
    try {
      const { id, ...updateData } = data;
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      await db
        .update(customers)
        .set({
          ...updateData,
          email: updateData.email || null,
          phone: updateData.phone || null,
          mobile: updateData.mobile || null,
          tpn: updateData.tpn || null,
          address: updateData.address || null,
          city: updateData.city || null,
          dzongkhag: updateData.dzongkhag || null,
          postalCode: updateData.postalCode || null,
          contactPerson: updateData.contactPerson || null,
          notes: updateData.notes || null,
          updatedAt: new Date(),
        })
        .where(and(eq(customers.id, id), eq(customers.teamId, team.id)));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.UPDATE_CUSTOMER}: ID ${id}`,
        timestamp: new Date(),
      });

      revalidatePath('/customers');
      revalidatePath(`/customers/${id}`);
      return { success: 'Customer updated successfully' };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { error: 'Failed to update customer' };
    }
  }
);

/**
 * Delete a customer (soft delete by setting isActive = false)
 */
export const deleteCustomer = validatedActionWithUser(
  deleteCustomerSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Soft delete by setting isActive = false
      await db
        .update(customers)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(customers.id, data.id), eq(customers.teamId, team.id)));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.DELETE_CUSTOMER}: ID ${data.id}`,
        timestamp: new Date(),
      });

      revalidatePath('/customers');
      return { success: 'Customer deleted successfully' };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return { error: 'Failed to delete customer' };
    }
  }
);
