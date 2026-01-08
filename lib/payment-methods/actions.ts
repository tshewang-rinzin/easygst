'use server';

import { z } from 'zod';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { paymentMethods, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { paymentMethodSchema, DEFAULT_BHUTAN_PAYMENT_METHODS } from './validation';

/**
 * Seed default payment methods for a team
 */
export const seedDefaultPaymentMethods = validatedActionWithUser(
  z.object({}),
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Check if already seeded
      const existing = await db
        .select({ id: paymentMethods.id })
        .from(paymentMethods)
        .where(eq(paymentMethods.teamId, team.id))
        .limit(1);

      if (existing.length > 0) {
        return { error: 'Payment methods already exist for this team' };
      }

      // Insert default methods
      const methods = DEFAULT_BHUTAN_PAYMENT_METHODS.map((method) => ({
        teamId: team.id,
        ...method,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(paymentMethods).values(methods);

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.CREATE_PAYMENT_METHOD,
        timestamp: new Date(),
      });

      revalidatePath('/settings/payment-methods');

      return { success: 'Default payment methods added successfully' };
    } catch (error) {
      console.error('Error seeding payment methods:', error);
      return { error: 'Failed to seed payment methods' };
    }
  }
);

/**
 * Create a new payment method
 */
export const createPaymentMethod = validatedActionWithUser(
  paymentMethodSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Create the payment method
      const [method] = await db
        .insert(paymentMethods)
        .values({
          teamId: team.id,
          code: data.code,
          name: data.name,
          description: data.description || null,
          isEnabled: data.isEnabled,
          sortOrder: data.sortOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.CREATE_PAYMENT_METHOD,
        timestamp: new Date(),
      });

      revalidatePath('/settings/payment-methods');

      return { success: 'Payment method added successfully', data: method };
    } catch (error) {
      console.error('Error creating payment method:', error);
      return { error: 'Failed to create payment method' };
    }
  }
);

/**
 * Update an existing payment method
 */
export const updatePaymentMethod = validatedActionWithUser(
  paymentMethodSchema.extend({ id: z.number().int().positive() }),
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Verify the method belongs to the team
      const [existingMethod] = await db
        .select()
        .from(paymentMethods)
        .where(
          and(
            eq(paymentMethods.id, data.id),
            eq(paymentMethods.teamId, team.id)
          )
        )
        .limit(1);

      if (!existingMethod) {
        return { error: 'Payment method not found' };
      }

      // Update the payment method
      const [method] = await db
        .update(paymentMethods)
        .set({
          code: data.code,
          name: data.name,
          description: data.description || null,
          isEnabled: data.isEnabled,
          sortOrder: data.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(paymentMethods.id, data.id))
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.UPDATE_PAYMENT_METHOD,
        timestamp: new Date(),
      });

      revalidatePath('/settings/payment-methods');

      return { success: 'Payment method updated successfully', data: method };
    } catch (error) {
      console.error('Error updating payment method:', error);
      return { error: 'Failed to update payment method' };
    }
  }
);

/**
 * Delete a payment method
 */
export const deletePaymentMethod = validatedActionWithUser(
  z.object({ id: z.number().int().positive() }),
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Verify the method belongs to the team
      const [existingMethod] = await db
        .select()
        .from(paymentMethods)
        .where(
          and(
            eq(paymentMethods.id, data.id),
            eq(paymentMethods.teamId, team.id)
          )
        )
        .limit(1);

      if (!existingMethod) {
        return { error: 'Payment method not found' };
      }

      // Delete the payment method
      await db
        .delete(paymentMethods)
        .where(eq(paymentMethods.id, data.id));

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.DELETE_PAYMENT_METHOD,
        timestamp: new Date(),
      });

      revalidatePath('/settings/payment-methods');

      return { success: 'Payment method deleted successfully' };
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return { error: 'Failed to delete payment method' };
    }
  }
);

/**
 * Toggle payment method enabled/disabled status
 */
export const togglePaymentMethod = validatedActionWithUser(
  z.object({
    id: z.number().int().positive(),
    isEnabled: z.boolean(),
  }),
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Verify the method belongs to the team
      const [existingMethod] = await db
        .select()
        .from(paymentMethods)
        .where(
          and(
            eq(paymentMethods.id, data.id),
            eq(paymentMethods.teamId, team.id)
          )
        )
        .limit(1);

      if (!existingMethod) {
        return { error: 'Payment method not found' };
      }

      // Update the payment method
      await db
        .update(paymentMethods)
        .set({
          isEnabled: data.isEnabled,
          updatedAt: new Date(),
        })
        .where(eq(paymentMethods.id, data.id));

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.UPDATE_PAYMENT_METHOD,
        timestamp: new Date(),
      });

      revalidatePath('/settings/payment-methods');

      return { success: `Payment method ${data.isEnabled ? 'enabled' : 'disabled'} successfully` };
    } catch (error) {
      console.error('Error toggling payment method:', error);
      return { error: 'Failed to update payment method' };
    }
  }
);
