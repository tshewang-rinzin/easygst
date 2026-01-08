'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  productSchema,
  updateProductSchema,
  deleteProductSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import { products, activityLogs, ActivityType } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Create a new product
 */
export const createProduct = validatedActionWithUser(
  productSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const [product] = await db
        .insert(products)
        .values({
          ...data,
          teamId: team.id,
          createdBy: user.id,
          description: data.description || null,
          sku: data.sku || null,
          categoryId: data.categoryId || null,
          category: data.category || null,
          unitPrice: data.unitPrice.toString(),
          defaultTaxRate: data.defaultTaxRate.toString(),
        })
        .returning();

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.CREATE_PRODUCT}: ${product.name}`,
        timestamp: new Date(),
      });

      revalidatePath('/products');
      return {
        success: 'Product created successfully',
        productId: product.id,
      };
    } catch (error) {
      console.error('Error creating product:', error);
      return { error: 'Failed to create product' };
    }
  }
);

/**
 * Update an existing product
 */
export const updateProduct = validatedActionWithUser(
  updateProductSchema,
  async (data, _, user) => {
    try {
      const { id, ...updateData } = data;
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      await db
        .update(products)
        .set({
          ...updateData,
          description: updateData.description || null,
          sku: updateData.sku || null,
          categoryId: updateData.categoryId || null,
          category: updateData.category || null,
          unitPrice: updateData.unitPrice.toString(),
          defaultTaxRate: updateData.defaultTaxRate.toString(),
          updatedAt: new Date(),
        })
        .where(and(eq(products.id, id), eq(products.teamId, team.id)));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.UPDATE_PRODUCT}: ID ${id}`,
        timestamp: new Date(),
      });

      revalidatePath('/products');
      revalidatePath(`/products/${id}`);
      return { success: 'Product updated successfully' };
    } catch (error) {
      console.error('Error updating product:', error);
      return { error: 'Failed to update product' };
    }
  }
);

/**
 * Delete a product (soft delete by setting isActive = false)
 */
export const deleteProduct = validatedActionWithUser(
  deleteProductSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Soft delete by setting isActive = false
      await db
        .update(products)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(products.id, data.id), eq(products.teamId, team.id)));

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.DELETE_PRODUCT}: ID ${data.id}`,
        timestamp: new Date(),
      });

      revalidatePath('/products');
      return { success: 'Product deleted successfully' };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { error: 'Failed to delete product' };
    }
  }
);
