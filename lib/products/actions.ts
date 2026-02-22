'use server';

import { validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import {
  productSchema,
  updateProductSchema,
  deleteProductSchema,
  saveVariantsSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import { products, productAttributeDefinitions, productVariants, activityLogs, ActivityType } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { checkUsageLimit } from '@/lib/features/limits';

/**
 * Create a new product
 */
export const createProduct = validatedActionWithUser(
  productSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Check usage limit
      const usageCheck = await checkUsageLimit('products', team.id);
      if (!usageCheck.allowed) {
        return { error: `You've reached the maximum of ${usageCheck.limit} products on your current plan. Current: ${usageCheck.current}.` };
      }

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
          productType: data.productType,
          trackInventory: data.productType === 'service' ? false : data.trackInventory,
          stockQuantity: data.stockQuantity,
          lowStockThreshold: data.lowStockThreshold,
        })
        .returning();

      // Handle inline variant creation
      const hasVariants = data.hasVariants === true;
      if (hasVariants && data.variantAttributes && data.variantData) {
        try {
          const variantAttributes = JSON.parse(data.variantAttributes as string);
          const variantData = JSON.parse(data.variantData as string);

          // Insert attribute definitions
          if (variantAttributes.length > 0) {
            await db.insert(productAttributeDefinitions).values(
              variantAttributes.map((attr: any, idx: number) => ({
                teamId: team.id,
                productId: product.id,
                name: attr.name,
                values: attr.values,
                sortOrder: idx,
              }))
            );
          }

          // Insert variants
          if (variantData.length > 0) {
            await db.insert(productVariants).values(
              variantData.map((v: any) => ({
                teamId: team.id,
                productId: product.id,
                name: v.name,
                sku: v.sku || null,
                barcode: v.barcode || null,
                attributeValues: v.attributeValues,
                unitPrice: v.unitPrice != null ? v.unitPrice.toString() : null,
                costPrice: v.costPrice != null ? v.costPrice.toString() : null,
                stockQuantity: v.stockQuantity || 0,
                lowStockThreshold: v.lowStockThreshold || 0,
                isActive: v.isActive ?? true,
              }))
            );
          }
        } catch (e) {
          console.error('Error creating variants inline:', e);
        }
      }

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
        hasVariants,
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
          productType: updateData.productType,
          trackInventory: updateData.productType === 'service' ? false : updateData.trackInventory,
          stockQuantity: updateData.stockQuantity,
          lowStockThreshold: updateData.lowStockThreshold,
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
 * Save product variants (bulk replace)
 * This action accepts JSON-encoded attributes and variants in FormData
 */
export async function saveProductVariants(prevState: any, formData: FormData) {
  try {
    const { getUser } = await import('@/lib/db/queries');
    const user = await getUser();
    if (!user) return { error: 'Not authenticated' };

    const team = await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    const productId = formData.get('productId') as string;
    const attributes = JSON.parse(formData.get('attributes') as string || '[]');
    const variants = JSON.parse(formData.get('variants') as string || '[]');

    if (!productId) return { error: 'Product ID is required' };

    // Verify product belongs to team
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.teamId, team.id)))
      .limit(1);

    if (!product) return { error: 'Product not found' };

    // Validate: check for duplicate SKUs among incoming variants
    const incomingSkus = variants
      .map((v: any) => v.sku?.trim())
      .filter((s: string | undefined) => s);
    const skuSet = new Set<string>();
    for (const sku of incomingSkus) {
      if (skuSet.has(sku)) {
        return { error: `Duplicate SKU "${sku}" among variants` };
      }
      skuSet.add(sku);
    }

    // Check SKUs against other products' variants in same team
    if (incomingSkus.length > 0) {
      const existingSkuVariants = await db
        .select({ sku: productVariants.sku })
        .from(productVariants)
        .where(
          and(
            eq(productVariants.teamId, team.id),
            ne(productVariants.productId, productId),
            eq(productVariants.isActive, true)
          )
        );
      const otherSkus = new Set(existingSkuVariants.map((v) => v.sku).filter(Boolean));
      for (const sku of incomingSkus) {
        if (otherSkus.has(sku)) {
          return { error: `SKU "${sku}" is already used by another product` };
        }
      }
    }

    // Delete and re-insert attribute definitions (no FKs reference them)
    await db.delete(productAttributeDefinitions).where(
      and(
        eq(productAttributeDefinitions.productId, productId),
        eq(productAttributeDefinitions.teamId, team.id)
      )
    );

    if (attributes.length > 0) {
      await db.insert(productAttributeDefinitions).values(
        attributes.map((attr: any, idx: number) => ({
          teamId: team.id,
          productId,
          name: attr.name,
          values: attr.values,
          sortOrder: idx,
        }))
      );
    }

    // Upsert variants — match existing by attributeValues or name
    const existingVariants = await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, productId),
          eq(productVariants.teamId, team.id)
        )
      );

    const matchedExistingIds = new Set<string>();
    const toUpdate: { existingId: string; data: any }[] = [];
    const toInsert: any[] = [];

    for (const v of variants) {
      const incomingAttrJson = JSON.stringify(v.attributeValues);
      // Match by attributeValues first, then by name
      const match = existingVariants.find(
        (ev) =>
          !matchedExistingIds.has(ev.id) &&
          (JSON.stringify(ev.attributeValues) === incomingAttrJson || ev.name === v.name)
      );

      const variantData = {
        name: v.name,
        sku: v.sku?.trim() || null,
        barcode: v.barcode || null,
        attributeValues: v.attributeValues,
        unitPrice: v.unitPrice != null ? v.unitPrice.toString() : null,
        costPrice: v.costPrice != null ? v.costPrice.toString() : null,
        stockQuantity: v.stockQuantity || 0,
        lowStockThreshold: v.lowStockThreshold || 0,
        isActive: v.isActive ?? true,
      };

      if (match) {
        matchedExistingIds.add(match.id);
        toUpdate.push({ existingId: match.id, data: variantData });
      } else {
        toInsert.push({ teamId: team.id, productId, ...variantData });
      }
    }

    // Update matched variants
    for (const { existingId, data } of toUpdate) {
      await db
        .update(productVariants)
        .set(data)
        .where(eq(productVariants.id, existingId));
    }

    // Insert new variants
    if (toInsert.length > 0) {
      await db.insert(productVariants).values(toInsert);
    }

    // Soft-delete removed variants (existing but not matched)
    const removedIds = existingVariants
      .filter((ev) => !matchedExistingIds.has(ev.id))
      .map((ev) => ev.id);
    if (removedIds.length > 0) {
      for (const id of removedIds) {
        await db
          .update(productVariants)
          .set({ isActive: false })
          .where(eq(productVariants.id, id));
      }
    }

    revalidatePath(`/products/${productId}`);
    return { success: 'Variants saved successfully' };
  } catch (error) {
    console.error('Error saving variants:', error);
    return { error: 'Failed to save variants' };
  }
}

/**
 * Duplicate a product with all attributes and variants
 */
export async function duplicateProduct(productId: string) {
  try {
    const { getUser } = await import('@/lib/db/queries');
    const user = await getUser();
    if (!user) return { error: 'Not authenticated' };

    const team = await getTeamForUser();
    if (!team) return { error: 'Team not found' };

    // Check usage limit
    const usageCheck = await checkUsageLimit('products', team.id);
    if (!usageCheck.allowed) {
      return { error: `You've reached the maximum products on your current plan.` };
    }

    // Get original product
    const [original] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.teamId, team.id)))
      .limit(1);

    if (!original) return { error: 'Product not found' };

    // Create copy
    const [newProduct] = await db
      .insert(products)
      .values({
        teamId: team.id,
        name: `${original.name} (Copy)`,
        description: original.description,
        sku: original.sku ? `${original.sku}-COPY` : null,
        unit: original.unit,
        productType: original.productType,
        unitPrice: original.unitPrice,
        defaultTaxRate: original.defaultTaxRate,
        isTaxExempt: original.isTaxExempt,
        gstClassification: original.gstClassification,
        categoryId: original.categoryId,
        category: original.category,
        trackInventory: original.trackInventory,
        stockQuantity: 0,
        lowStockThreshold: original.lowStockThreshold,
        barcode: null,
        isActive: true,
        createdBy: user.id,
      })
      .returning();

    // Copy attribute definitions
    const attrs = await db
      .select()
      .from(productAttributeDefinitions)
      .where(and(
        eq(productAttributeDefinitions.productId, productId),
        eq(productAttributeDefinitions.teamId, team.id)
      ));

    if (attrs.length > 0) {
      await db.insert(productAttributeDefinitions).values(
        attrs.map((a) => ({
          teamId: team.id,
          productId: newProduct.id,
          name: a.name,
          values: a.values,
          sortOrder: a.sortOrder,
        }))
      );
    }

    // Copy active variants
    const vars = await db
      .select()
      .from(productVariants)
      .where(and(
        eq(productVariants.productId, productId),
        eq(productVariants.teamId, team.id),
        eq(productVariants.isActive, true)
      ));

    if (vars.length > 0) {
      await db.insert(productVariants).values(
        vars.map((v) => ({
          teamId: team.id,
          productId: newProduct.id,
          name: v.name,
          sku: v.sku ? `${v.sku}-COPY` : null,
          barcode: null,
          attributeValues: v.attributeValues,
          unitPrice: v.unitPrice,
          costPrice: v.costPrice,
          stockQuantity: 0,
          lowStockThreshold: v.lowStockThreshold,
          isActive: true,
        }))
      );
    }

    // Activity log
    await db.insert(activityLogs).values({
      teamId: team.id,
      userId: user.id,
      action: `${ActivityType.CREATE_PRODUCT}: Duplicated "${original.name}" → "${newProduct.name}"`,
      timestamp: new Date(),
    });

    revalidatePath('/products');
    return { success: true, productId: newProduct.id };
  } catch (error) {
    console.error('Error duplicating product:', error);
    return { error: 'Failed to duplicate product' };
  }
}

/**
 * Delete a product (soft delete by setting isActive = false)
 */
export const deleteProduct = validatedActionWithRole(
  deleteProductSchema,
  'admin',
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
