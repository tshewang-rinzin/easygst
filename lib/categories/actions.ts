'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { productCategories } from '@/lib/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { validatedAction, validatedActionWithUser } from '@/lib/auth/middleware';
import { getTeamForUser } from '@/lib/db/queries';
import { categorySchema } from './validation';
import { booleanCoerce } from '@/lib/validation-helpers';

/**
 * Create a new product category
 */
export const createCategory = validatedActionWithUser(
  categorySchema,
  async (data, _, user) => {
    const team = await getTeamForUser();
    if (!team) {
      return { error: 'No team found' };
    }

    // Check if category name already exists for this team
    const [existing] = await db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.teamId, team.id),
          eq(productCategories.name, data.name)
        )
      )
      .limit(1);

    if (existing) {
      return { error: 'Category with this name already exists' };
    }

    const [category] = await db
      .insert(productCategories)
      .values({
        teamId: team.id,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      })
      .returning();

    revalidatePath('/products/categories');
    revalidatePath('/products');

    return { success: 'Category created successfully', categoryId: category.id };
  }
);

/**
 * Update an existing product category
 */
export const updateCategory = validatedActionWithUser(
  categorySchema.extend({ id: z.string().uuid() }),
  async (data, _, user) => {
    const team = await getTeamForUser();
    if (!team) {
      return { error: 'No team found' };
    }

    // Verify the category belongs to the user's team
    const [existing] = await db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.id, data.id),
          eq(productCategories.teamId, team.id)
        )
      )
      .limit(1);

    if (!existing) {
      return { error: 'Category not found' };
    }

    // Check if new name conflicts with another category
    const [duplicate] = await db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.teamId, team.id),
          eq(productCategories.name, data.name),
          // Exclude current category from check
          ne(productCategories.id, data.id)
        )
      )
      .limit(1);

    if (duplicate && duplicate.id !== data.id) {
      return { error: 'Category with this name already exists' };
    }

    await db
      .update(productCategories)
      .set({
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(productCategories.id, data.id));

    revalidatePath('/products/categories');
    revalidatePath('/products');

    return { success: 'Category updated successfully' };
  }
);

/**
 * Delete (deactivate) a product category
 */
export const deleteCategory = validatedActionWithUser(
  z.object({ id: z.string().uuid() }),
  async (data, _, user) => {
    const team = await getTeamForUser();
    if (!team) {
      return { error: 'No team found' };
    }

    // Verify the category belongs to the user's team
    const [existing] = await db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.id, data.id),
          eq(productCategories.teamId, team.id)
        )
      )
      .limit(1);

    if (!existing) {
      return { error: 'Category not found' };
    }

    // Soft delete by setting isActive to false
    await db
      .update(productCategories)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(productCategories.id, data.id));

    revalidatePath('/products/categories');
    revalidatePath('/products');

    return { success: 'Category deleted successfully' };
  }
);

/**
 * Toggle category active status
 */
export const toggleCategoryStatus = validatedActionWithUser(
  z.object({
    id: z.string().uuid(),
    isActive: booleanCoerce(false),
  }),
  async (data, _, user) => {
    const team = await getTeamForUser();
    if (!team) {
      return { error: 'No team found' };
    }

    await db
      .update(productCategories)
      .set({
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(productCategories.id, data.id),
          eq(productCategories.teamId, team.id)
        )
      );

    revalidatePath('/products/categories');
    revalidatePath('/products');

    return { success: `Category ${data.isActive ? 'activated' : 'deactivated'} successfully` };
  }
);
