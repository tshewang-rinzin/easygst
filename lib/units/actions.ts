'use server';

import { z } from 'zod';
import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import { unitSchema, updateUnitSchema, deleteUnitSchema } from './validation';
import { db } from '@/lib/db/drizzle';
import { units, activityLogs, ActivityType } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { unitNameExists } from './queries';

/**
 * Create a new unit
 */
export const createUnit = validatedActionWithUser(
  unitSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check if unit name already exists
      const exists = await unitNameExists(data.name);
      if (exists) {
        return { error: 'A unit with this name already exists' };
      }

      const [unit] = await db
        .insert(units)
        .values({
          teamId: team.id,
          name: data.name,
          abbreviation: data.abbreviation,
          category: data.category,
          description: data.description || null,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          createdBy: user.id,
        })
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `CREATE_UNIT: Unit "${data.name}" created`,
        timestamp: new Date(),
      });

      revalidatePath('/settings/units');
      revalidatePath('/products');
      revalidatePath('/invoices');

      return { success: 'Unit created successfully', unitId: unit.id };
    } catch (error) {
      console.error('Error creating unit:', error);
      return { error: 'Failed to create unit' };
    }
  }
);

/**
 * Update an existing unit
 */
export const updateUnit = validatedActionWithUser(
  updateUnitSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check if unit exists and belongs to team
      const [existing] = await db
        .select()
        .from(units)
        .where(and(eq(units.id, data.id), eq(units.teamId, team.id)))
        .limit(1);

      if (!existing) {
        return { error: 'Unit not found' };
      }

      // Check if new name conflicts with another unit
      if (data.name !== existing.name) {
        const nameExists = await unitNameExists(data.name, data.id);
        if (nameExists) {
          return { error: 'A unit with this name already exists' };
        }
      }

      await db
        .update(units)
        .set({
          name: data.name,
          abbreviation: data.abbreviation,
          category: data.category,
          description: data.description || null,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        })
        .where(and(eq(units.id, data.id), eq(units.teamId, team.id)));

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `UPDATE_UNIT: Unit "${data.name}" updated`,
        timestamp: new Date(),
      });

      revalidatePath('/settings/units');
      revalidatePath('/products');
      revalidatePath('/invoices');

      return { success: 'Unit updated successfully' };
    } catch (error) {
      console.error('Error updating unit:', error);
      return { error: 'Failed to update unit' };
    }
  }
);

/**
 * Delete a unit (soft delete by setting isActive to false)
 */
export const deleteUnit = validatedActionWithRole(
  deleteUnitSchema,
  'admin',
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check if unit exists and belongs to team
      const [existing] = await db
        .select()
        .from(units)
        .where(and(eq(units.id, data.id), eq(units.teamId, team.id)))
        .limit(1);

      if (!existing) {
        return { error: 'Unit not found' };
      }

      // Soft delete by setting isActive to false
      await db
        .update(units)
        .set({ isActive: false })
        .where(and(eq(units.id, data.id), eq(units.teamId, team.id)));

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `DELETE_UNIT: Unit "${existing.name}" deleted`,
        timestamp: new Date(),
      });

      revalidatePath('/settings/units');
      revalidatePath('/products');
      revalidatePath('/invoices');

      return { success: 'Unit deleted successfully' };
    } catch (error) {
      console.error('Error deleting unit:', error);
      return { error: 'Failed to delete unit' };
    }
  }
);

/**
 * Seed default units for a team
 */
export async function seedDefaultUnits(teamId: string, userId: string) {
  const defaultUnits = [
    // Common (most used — top of every list)
    { name: 'Piece', abbreviation: 'pcs', category: 'common', description: 'Individual items', sortOrder: 1 },
    { name: 'Service', abbreviation: 'svc', category: 'common', description: 'Service or consultation', sortOrder: 2 },
    { name: 'Unit', abbreviation: 'unit', category: 'common', description: 'Generic unit', sortOrder: 3 },
    { name: 'Lot', abbreviation: 'lot', category: 'common', description: 'Lot or batch', sortOrder: 4 },
    // Time
    { name: 'Hour', abbreviation: 'hr', category: 'time', description: 'Hour', sortOrder: 10 },
    { name: 'Day', abbreviation: 'day', category: 'time', description: 'Day', sortOrder: 11 },
    { name: 'Month', abbreviation: 'mo', category: 'time', description: 'Month', sortOrder: 12 },
    { name: 'Year', abbreviation: 'yr', category: 'time', description: 'Year', sortOrder: 13 },
    // Quantity
    { name: 'Packet', abbreviation: 'pkt', category: 'quantity', description: 'Packet or pack', sortOrder: 20 },
    { name: 'Box', abbreviation: 'box', category: 'quantity', description: 'Box or carton', sortOrder: 21 },
    { name: 'Set', abbreviation: 'set', category: 'quantity', description: 'Set of items', sortOrder: 22 },
    { name: 'Pair', abbreviation: 'pair', category: 'quantity', description: 'Pair of items', sortOrder: 23 },
    // Weight
    { name: 'Kilogram', abbreviation: 'kg', category: 'weight', description: 'Kilogram', sortOrder: 30 },
    { name: 'Gram', abbreviation: 'g', category: 'weight', description: 'Gram', sortOrder: 31 },
    // Volume
    { name: 'Liter', abbreviation: 'L', category: 'volume', description: 'Liter', sortOrder: 40 },
    { name: 'Milliliter', abbreviation: 'ml', category: 'volume', description: 'Milliliter', sortOrder: 41 },
    // Length
    { name: 'Meter', abbreviation: 'm', category: 'length', description: 'Meter', sortOrder: 50 },
    { name: 'Square Meter', abbreviation: 'sqm', category: 'length', description: 'Square meter (area)', sortOrder: 51 },
    { name: 'Feet', abbreviation: 'ft', category: 'length', description: 'Feet', sortOrder: 52 },
  ];

  try {
    await db.insert(units).values(
      defaultUnits.map((unit) => ({
        teamId,
        name: unit.name,
        abbreviation: unit.abbreviation,
        category: unit.category,
        description: unit.description,
        sortOrder: unit.sortOrder,
        isActive: true,
        createdBy: userId,
      }))
    );
  } catch (error) {
    console.error('Error seeding default units:', error);
  }
}

/**
 * Reset units to defaults (removes all existing, adds defaults)
 */
export const resetToDefaultUnits = validatedActionWithRole(
  z.object({}),
  'owner',
  async (_, __, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Delete all existing units for this team
      await db.delete(units).where(eq(units.teamId, team.id));

      // Seed default units
      await seedDefaultUnits(team.id, user.id);

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `RESET_UNITS: Reset units to defaults`,
        timestamp: new Date(),
      });

      revalidatePath('/settings/units');
      revalidatePath('/products');
      revalidatePath('/invoices');

      return { success: 'Units reset to defaults successfully' };
    } catch (error) {
      console.error('Error resetting units:', error);
      return { error: 'Failed to reset units to defaults' };
    }
  }
);
