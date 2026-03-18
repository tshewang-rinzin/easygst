'use server';

import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { unitsOfMeasure, productUnits, products, activityLogs, ActivityType } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ============================================================
// SCHEMAS
// ============================================================

const createUnitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  abbreviation: z.string().min(1, 'Abbreviation is required').max(10),
  type: z.enum(['quantity', 'weight', 'volume', 'length', 'area', 'time']),
  isBaseUnit: z.boolean().optional().default(false),
  conversionToBase: z.number().min(0).default(1),
});

const updateUnitSchema = createUnitSchema.extend({
  id: z.string().uuid(),
});

const deleteUnitSchema = z.object({
  id: z.string().uuid(),
});

const setProductUnitsSchema = z.object({
  productId: z.string().uuid(),
  units: z.array(z.object({
    unitId: z.string().uuid(),
    isDefault: z.boolean().default(false),
    pricePerUnit: z.number().optional(),
    conversionFactor: z.number().min(0).default(1),
    barcode: z.string().optional(),
  })),
});

// ============================================================
// UNIT OF MEASURE ACTIONS
// ============================================================

/**
 * Get all units of measure for a team
 */
export async function getUnitsOfMeasure(teamId?: string) {
  try {
    const team = teamId ? { id: teamId } : await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    const units = await db
      .select()
      .from(unitsOfMeasure)
      .where(and(
        eq(unitsOfMeasure.teamId, team.id),
        eq(unitsOfMeasure.isActive, true)
      ))
      .orderBy(unitsOfMeasure.type, unitsOfMeasure.name);

    return { success: true, data: units };
  } catch (error) {
    console.error('Error fetching units of measure:', error);
    return { error: 'Failed to fetch units of measure' };
  }
}

/**
 * Create a new unit of measure
 */
export const createUnit = validatedActionWithUser(
  createUnitSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check if unit name or abbreviation already exists
      const existing = await db
        .select()
        .from(unitsOfMeasure)
        .where(and(
          eq(unitsOfMeasure.teamId, team.id),
          eq(unitsOfMeasure.isActive, true),
          and(
            eq(unitsOfMeasure.name, data.name),
            eq(unitsOfMeasure.abbreviation, data.abbreviation)
          )
        ))
        .limit(1);

      if (existing.length > 0) {
        return { error: 'A unit with this name or abbreviation already exists' };
      }

      // If this is being set as base unit, ensure no other base unit exists for this type
      if (data.isBaseUnit) {
        const existingBase = await db
          .select()
          .from(unitsOfMeasure)
          .where(and(
            eq(unitsOfMeasure.teamId, team.id),
            eq(unitsOfMeasure.type, data.type),
            eq(unitsOfMeasure.isBaseUnit, true),
            eq(unitsOfMeasure.isActive, true)
          ))
          .limit(1);

        if (existingBase.length > 0) {
          // Update existing base unit to not be base
          await db
            .update(unitsOfMeasure)
            .set({ isBaseUnit: false, updatedAt: new Date() })
            .where(eq(unitsOfMeasure.id, existingBase[0].id));
        }
      }

      const [unit] = await db
        .insert(unitsOfMeasure)
        .values({
          teamId: team.id,
          name: data.name,
          abbreviation: data.abbreviation,
          type: data.type,
          isBaseUnit: data.isBaseUnit || false,
          conversionToBase: data.conversionToBase.toString(),
        })
        .returning();

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `Create Unit: ${unit.name} (${unit.abbreviation})`,
        timestamp: new Date(),
      });

      revalidatePath('/products/units');
      return { success: 'Unit created successfully', data: unit };
    } catch (error) {
      console.error('Error creating unit:', error);
      return { error: 'Failed to create unit' };
    }
  }
);

/**
 * Update a unit of measure
 */
export const updateUnit = validatedActionWithUser(
  updateUnitSchema,
  async (data, _, user) => {
    try {
      const { id, ...updateData } = data;
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check if unit exists and belongs to team
      const [existingUnit] = await db
        .select()
        .from(unitsOfMeasure)
        .where(and(
          eq(unitsOfMeasure.id, id),
          eq(unitsOfMeasure.teamId, team.id)
        ))
        .limit(1);

      if (!existingUnit) {
        return { error: 'Unit not found' };
      }

      // Check for name/abbreviation conflicts (excluding current unit)
      const existing = await db
        .select()
        .from(unitsOfMeasure)
        .where(and(
          eq(unitsOfMeasure.teamId, team.id),
          eq(unitsOfMeasure.isActive, true),
          eq(unitsOfMeasure.id, id),
          and(
            eq(unitsOfMeasure.name, updateData.name),
            eq(unitsOfMeasure.abbreviation, updateData.abbreviation)
          )
        ))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        return { error: 'A unit with this name or abbreviation already exists' };
      }

      // Handle base unit logic
      if (updateData.isBaseUnit && updateData.type !== existingUnit.type) {
        const existingBase = await db
          .select()
          .from(unitsOfMeasure)
          .where(and(
            eq(unitsOfMeasure.teamId, team.id),
            eq(unitsOfMeasure.type, updateData.type),
            eq(unitsOfMeasure.isBaseUnit, true),
            eq(unitsOfMeasure.isActive, true)
          ))
          .limit(1);

        if (existingBase.length > 0) {
          await db
            .update(unitsOfMeasure)
            .set({ isBaseUnit: false, updatedAt: new Date() })
            .where(eq(unitsOfMeasure.id, existingBase[0].id));
        }
      }

      await db
        .update(unitsOfMeasure)
        .set({
          ...updateData,
          conversionToBase: updateData.conversionToBase.toString(),
          updatedAt: new Date(),
        })
        .where(eq(unitsOfMeasure.id, id));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `Update Unit: ${updateData.name} (${updateData.abbreviation})`,
        timestamp: new Date(),
      });

      revalidatePath('/products/units');
      return { success: 'Unit updated successfully' };
    } catch (error) {
      console.error('Error updating unit:', error);
      return { error: 'Failed to update unit' };
    }
  }
);

/**
 * Delete a unit of measure (soft delete)
 */
export const deleteUnit = validatedActionWithRole(
  deleteUnitSchema,
  'admin',
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check if unit is in use by any products
      const productUnitsInUse = await db
        .select()
        .from(productUnits)
        .where(and(
          eq(productUnits.unitId, data.id),
          eq(productUnits.teamId, team.id),
          eq(productUnits.isActive, true)
        ))
        .limit(1);

      if (productUnitsInUse.length > 0) {
        return { error: 'Cannot delete unit that is assigned to products. Remove from products first.' };
      }

      // Soft delete by setting isActive = false
      await db
        .update(unitsOfMeasure)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(unitsOfMeasure.id, data.id),
          eq(unitsOfMeasure.teamId, team.id)
        ));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `Delete Unit: ID ${data.id}`,
        timestamp: new Date(),
      });

      revalidatePath('/products/units');
      return { success: 'Unit deleted successfully' };
    } catch (error) {
      console.error('Error deleting unit:', error);
      return { error: 'Failed to delete unit' };
    }
  }
);

// ============================================================
// PRODUCT UNIT ACTIONS
// ============================================================

/**
 * Get units assigned to a product
 */
export async function getProductUnits(productId: string) {
  try {
    const team = await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    const units = await db
      .select({
        id: productUnits.id,
        unitId: productUnits.unitId,
        isDefault: productUnits.isDefault,
        pricePerUnit: productUnits.pricePerUnit,
        conversionFactor: productUnits.conversionFactor,
        barcode: productUnits.barcode,
        unitName: unitsOfMeasure.name,
        unitAbbreviation: unitsOfMeasure.abbreviation,
        unitType: unitsOfMeasure.type,
      })
      .from(productUnits)
      .innerJoin(unitsOfMeasure, eq(productUnits.unitId, unitsOfMeasure.id))
      .where(and(
        eq(productUnits.productId, productId),
        eq(productUnits.teamId, team.id),
        eq(productUnits.isActive, true)
      ));

    return { success: true, data: units };
  } catch (error) {
    console.error('Error fetching product units:', error);
    return { error: 'Failed to fetch product units' };
  }
}

/**
 * Set units for a product (replaces existing)
 */
export const setProductUnits = validatedActionWithUser(
  setProductUnitsSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Verify product exists and belongs to team
      const [product] = await db
        .select()
        .from(products)
        .where(and(
          eq(products.id, data.productId),
          eq(products.teamId, team.id)
        ))
        .limit(1);

      if (!product) {
        return { error: 'Product not found' };
      }

      // Ensure only one unit is marked as default
      const defaultUnits = data.units.filter(u => u.isDefault);
      if (defaultUnits.length > 1) {
        return { error: 'Only one unit can be set as default' };
      }

      // Remove existing product units
      await db
        .update(productUnits)
        .set({ isActive: false })
        .where(and(
          eq(productUnits.productId, data.productId),
          eq(productUnits.teamId, team.id)
        ));

      // Insert new product units
      if (data.units.length > 0) {
        await db.insert(productUnits).values(
          data.units.map((unit) => ({
            teamId: team.id,
            productId: data.productId,
            unitId: unit.unitId,
            isDefault: unit.isDefault,
            pricePerUnit: unit.pricePerUnit ? unit.pricePerUnit.toString() : null,
            conversionFactor: unit.conversionFactor.toString(),
            barcode: unit.barcode || null,
          }))
        );
      }

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `Set Product Units: ${product.name} (${data.units.length} units)`,
        timestamp: new Date(),
      });

      revalidatePath(`/products/${data.productId}`);
      revalidatePath('/products');
      return { success: 'Product units updated successfully' };
    } catch (error) {
      console.error('Error setting product units:', error);
      return { error: 'Failed to update product units' };
    }
  }
);

// ============================================================
// SEED DEFAULT UNITS
// ============================================================

/**
 * Seed default units for a team
 */
export async function seedDefaultUnits(teamId?: string) {
  try {
    const team = teamId ? { id: teamId } : await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    // Check if team already has units
    const existingUnits = await db
      .select()
      .from(unitsOfMeasure)
      .where(and(
        eq(unitsOfMeasure.teamId, team.id),
        eq(unitsOfMeasure.isActive, true)
      ))
      .limit(1);

    if (existingUnits.length > 0) {
      return { error: 'Team already has units. Seed can only be run on teams with no existing units.' };
    }

    const defaultUnits = [
      // Quantity
      { name: 'Piece', abbreviation: 'pc', type: 'quantity', isBaseUnit: true, conversionToBase: 1 },
      { name: 'Dozen', abbreviation: 'dz', type: 'quantity', isBaseUnit: false, conversionToBase: 12 },
      { name: 'Carton', abbreviation: 'ctn', type: 'quantity', isBaseUnit: false, conversionToBase: 24 },
      { name: 'Box', abbreviation: 'box', type: 'quantity', isBaseUnit: false, conversionToBase: 1 },
      { name: 'Pack', abbreviation: 'pk', type: 'quantity', isBaseUnit: false, conversionToBase: 1 },
      
      // Weight
      { name: 'Gram', abbreviation: 'g', type: 'weight', isBaseUnit: true, conversionToBase: 1 },
      { name: 'Kilogram', abbreviation: 'kg', type: 'weight', isBaseUnit: false, conversionToBase: 1000 },
      { name: 'Pound', abbreviation: 'lb', type: 'weight', isBaseUnit: false, conversionToBase: 453.592 },
      
      // Volume
      { name: 'Milliliter', abbreviation: 'ml', type: 'volume', isBaseUnit: true, conversionToBase: 1 },
      { name: 'Liter', abbreviation: 'L', type: 'volume', isBaseUnit: false, conversionToBase: 1000 },
      
      // Length
      { name: 'Centimeter', abbreviation: 'cm', type: 'length', isBaseUnit: true, conversionToBase: 1 },
      { name: 'Meter', abbreviation: 'm', type: 'length', isBaseUnit: false, conversionToBase: 100 },
      { name: 'Inch', abbreviation: 'in', type: 'length', isBaseUnit: false, conversionToBase: 2.54 },
    ];

    await db.insert(unitsOfMeasure).values(
      defaultUnits.map((unit) => ({
        teamId: team.id,
        name: unit.name,
        abbreviation: unit.abbreviation,
        type: unit.type as 'quantity' | 'weight' | 'volume' | 'length' | 'area' | 'time',
        isBaseUnit: unit.isBaseUnit,
        conversionToBase: unit.conversionToBase.toString(),
      }))
    );

    return { success: `Successfully seeded ${defaultUnits.length} default units` };
  } catch (error) {
    console.error('Error seeding default units:', error);
    return { error: 'Failed to seed default units' };
  }
}