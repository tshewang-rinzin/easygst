'use server';

import { validatedActionWithUser, validatedActionWithPlatformAdmin } from '@/lib/auth/middleware';
import {
  businessTypeSchema,
  updateBusinessTypeSchema,
  deleteBusinessTypeSchema,
  masterProductCategorySchema,
  updateMasterProductCategorySchema,
  deleteMasterProductCategorySchema,
  masterProductSchema,
  updateMasterProductSchema,
  deleteMasterProductSchema,
  importMasterProductsSchema,
  addMasterProductsToTeamSchema,
} from './validation';
import { db } from '@/lib/db/drizzle';
import {
  businessTypes,
  masterProductCategories,
  masterProducts,
  products,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { getTeamForUser, getPlatformAdmin } from '@/lib/db/queries';
import { eq, and, like, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============================================================
// BUSINESS TYPES
// ============================================================

/**
 * Create a new business type (Admin only)
 */
export const createBusinessType = validatedActionWithPlatformAdmin(
  businessTypeSchema,
  async (data, _, user) => {
    try {
      const admin = await getPlatformAdmin();
      if (!admin) return { error: 'Unauthorized' };

      const [businessType] = await db
        .insert(businessTypes)
        .values({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          icon: data.icon || null,
          isActive: data.isActive,
        })
        .returning();

      revalidatePath('/admin/master-products');
      revalidatePath('/admin/master-products/business-types');
      return {
        success: 'Business type created successfully',
        businessTypeId: businessType.id,
      };
    } catch (error) {
      console.error('Error creating business type:', error);
      return { error: 'Failed to create business type' };
    }
  }
);

/**
 * Update an existing business type (Admin only)
 */
export const updateBusinessType = validatedActionWithPlatformAdmin(
  updateBusinessTypeSchema,
  async (data, _, user) => {
    try {
      const admin = await getPlatformAdmin();
      if (!admin) return { error: 'Unauthorized' };

      const { id, ...updateData } = data;

      await db
        .update(businessTypes)
        .set({
          name: updateData.name,
          slug: updateData.slug,
          description: updateData.description || null,
          icon: updateData.icon || null,
          isActive: updateData.isActive,
          updatedAt: new Date(),
        })
        .where(eq(businessTypes.id, id));

      revalidatePath('/admin/master-products');
      revalidatePath('/admin/master-products/business-types');
      return { success: 'Business type updated successfully' };
    } catch (error) {
      console.error('Error updating business type:', error);
      return { error: 'Failed to update business type' };
    }
  }
);

/**
 * Delete a business type (Admin only)
 */
export const deleteBusinessType = validatedActionWithPlatformAdmin(
  deleteBusinessTypeSchema,
  async (data, _, user) => {
    try {
      const admin = await getPlatformAdmin();
      if (!admin) return { error: 'Unauthorized' };

      await db.delete(businessTypes).where(eq(businessTypes.id, data.id));

      revalidatePath('/admin/master-products');
      revalidatePath('/admin/master-products/business-types');
      return { success: 'Business type deleted successfully' };
    } catch (error) {
      console.error('Error deleting business type:', error);
      return { error: 'Failed to delete business type' };
    }
  }
);

// ============================================================
// MASTER PRODUCT CATEGORIES
// ============================================================

/**
 * Create a new master product category (Admin only)
 */
export const createMasterProductCategory = validatedActionWithPlatformAdmin(
  masterProductCategorySchema,
  async (data, _, user) => {
    try {
      const admin = await getPlatformAdmin();
      if (!admin) return { error: 'Unauthorized' };

      const [category] = await db
        .insert(masterProductCategories)
        .values({
          businessTypeId: data.businessTypeId,
          name: data.name,
          slug: data.slug,
          parentId: data.parentId || null,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        })
        .returning();

      revalidatePath('/admin/master-products');
      revalidatePath('/admin/master-products/categories');
      return {
        success: 'Category created successfully',
        categoryId: category.id,
      };
    } catch (error) {
      console.error('Error creating master product category:', error);
      return { error: 'Failed to create category' };
    }
  }
);

/**
 * Update an existing master product category (Admin only)
 */
export const updateMasterProductCategory = validatedActionWithPlatformAdmin(
  updateMasterProductCategorySchema,
  async (data, _, user) => {
    try {
      const admin = await getPlatformAdmin();
      if (!admin) return { error: 'Unauthorized' };

      const { id, ...updateData } = data;

      await db
        .update(masterProductCategories)
        .set({
          businessTypeId: updateData.businessTypeId,
          name: updateData.name,
          slug: updateData.slug,
          parentId: updateData.parentId || null,
          sortOrder: updateData.sortOrder,
          isActive: updateData.isActive,
        })
        .where(eq(masterProductCategories.id, id));

      revalidatePath('/admin/master-products');
      revalidatePath('/admin/master-products/categories');
      return { success: 'Category updated successfully' };
    } catch (error) {
      console.error('Error updating master product category:', error);
      return { error: 'Failed to update category' };
    }
  }
);

/**
 * Delete a master product category (Admin only)
 */
export const deleteMasterProductCategory = validatedActionWithPlatformAdmin(
  deleteMasterProductCategorySchema,
  async (data, _, user) => {
    try {
      const admin = await getPlatformAdmin();
      if (!admin) return { error: 'Unauthorized' };

      await db.delete(masterProductCategories).where(eq(masterProductCategories.id, data.id));

      revalidatePath('/admin/master-products');
      revalidatePath('/admin/master-products/categories');
      return { success: 'Category deleted successfully' };
    } catch (error) {
      console.error('Error deleting master product category:', error);
      return { error: 'Failed to delete category' };
    }
  }
);

// ============================================================
// MASTER PRODUCTS
// ============================================================

/**
 * Create a new master product (Admin only)
 */
export const createMasterProduct = validatedActionWithPlatformAdmin(
  masterProductSchema,
  async (data, _, user) => {
    try {
      const admin = await getPlatformAdmin();
      if (!admin) return { error: 'Unauthorized' };

      const [masterProduct] = await db
        .insert(masterProducts)
        .values({
          businessTypeId: data.businessTypeId,
          categoryId: data.categoryId,
          name: data.name,
          description: data.description || null,
          defaultSku: data.defaultSku || null,
          defaultBarcode: data.defaultBarcode || null,
          defaultUnit: data.defaultUnit,
          defaultGstRate: data.defaultGstRate.toString(),
          defaultTaxClassification: data.defaultTaxClassification,
          imageUrl: data.imageUrl || null,
          isActive: data.isActive,
        })
        .returning();

      revalidatePath('/admin/master-products');
      return {
        success: 'Master product created successfully',
        masterProductId: masterProduct.id,
      };
    } catch (error) {
      console.error('Error creating master product:', error);
      return { error: 'Failed to create master product' };
    }
  }
);

/**
 * Update an existing master product (Admin only)
 */
export const updateMasterProduct = validatedActionWithPlatformAdmin(
  updateMasterProductSchema,
  async (data, _, user) => {
    try {
      const admin = await getPlatformAdmin();
      if (!admin) return { error: 'Unauthorized' };

      const { id, ...updateData } = data;

      await db
        .update(masterProducts)
        .set({
          businessTypeId: updateData.businessTypeId,
          categoryId: updateData.categoryId,
          name: updateData.name,
          description: updateData.description || null,
          defaultSku: updateData.defaultSku || null,
          defaultBarcode: updateData.defaultBarcode || null,
          defaultUnit: updateData.defaultUnit,
          defaultGstRate: updateData.defaultGstRate.toString(),
          defaultTaxClassification: updateData.defaultTaxClassification,
          imageUrl: updateData.imageUrl || null,
          isActive: updateData.isActive,
          updatedAt: new Date(),
        })
        .where(eq(masterProducts.id, id));

      revalidatePath('/admin/master-products');
      revalidatePath(`/admin/master-products/${id}/edit`);
      return { success: 'Master product updated successfully' };
    } catch (error) {
      console.error('Error updating master product:', error);
      return { error: 'Failed to update master product' };
    }
  }
);

/**
 * Delete a master product (Admin only)
 */
export const deleteMasterProduct = validatedActionWithPlatformAdmin(
  deleteMasterProductSchema,
  async (data, _, user) => {
    try {
      const admin = await getPlatformAdmin();
      if (!admin) return { error: 'Unauthorized' };

      await db.delete(masterProducts).where(eq(masterProducts.id, data.id));

      revalidatePath('/admin/master-products');
      return { success: 'Master product deleted successfully' };
    } catch (error) {
      console.error('Error deleting master product:', error);
      return { error: 'Failed to delete master product' };
    }
  }
);

// ============================================================
// CSV IMPORT
// ============================================================

/**
 * Import master products from CSV (Admin only)
 */
export const importMasterProducts = validatedActionWithPlatformAdmin(
  importMasterProductsSchema,
  async (data, _, user) => {
    try {
      const admin = await getPlatformAdmin();
      if (!admin) return { error: 'Unauthorized' };

      const lines = data.csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1);

      // Expected headers: name,description,sku,barcode,unit,gstRate,category,businessType
      const requiredHeaders = ['name', 'category'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        return { error: `Missing required headers: ${missingHeaders.join(', ')}` };
      }

      let imported = 0;
      let errors: string[] = [];

      for (const [index, row] of dataRows.entries()) {
        try {
          const values = row.split(',').map(v => v.trim());
          const rowData: any = {};
          headers.forEach((header, i) => {
            rowData[header] = values[i] || '';
          });

          // Find or create category
          let categoryId = null;
          if (rowData.category) {
            const categorySlug = rowData.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
            let category = await db
              .select()
              .from(masterProductCategories)
              .where(
                and(
                  eq(masterProductCategories.businessTypeId, data.businessTypeId),
                  eq(masterProductCategories.slug, categorySlug)
                )
              )
              .limit(1);

            if (category.length === 0) {
              // Create category
              const [newCategory] = await db
                .insert(masterProductCategories)
                .values({
                  businessTypeId: data.businessTypeId,
                  name: rowData.category,
                  slug: categorySlug,
                  sortOrder: 0,
                  isActive: true,
                })
                .returning();
              categoryId = newCategory.id;
            } else {
              categoryId = category[0].id;
            }
          }

          if (!categoryId) {
            errors.push(`Row ${index + 2}: Category is required`);
            continue;
          }

          // Create master product
          await db.insert(masterProducts).values({
            businessTypeId: data.businessTypeId,
            categoryId,
            name: rowData.name,
            description: rowData.description || null,
            defaultSku: rowData.sku || null,
            defaultBarcode: rowData.barcode || null,
            defaultUnit: rowData.unit || 'piece',
            defaultGstRate: rowData.gstRate ? parseFloat(rowData.gstRate).toString() : '0',
            defaultTaxClassification: 'STANDARD',
            isActive: true,
          });

          imported++;
        } catch (error) {
          console.error(`Error importing row ${index + 2}:`, error);
          errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      revalidatePath('/admin/master-products');
      revalidatePath('/admin/master-products/import');

      const message = `Imported ${imported} products successfully`;
      if (errors.length > 0) {
        return {
          success: `${message}. ${errors.length} errors occurred: ${errors.slice(0, 3).join('; ')}${
            errors.length > 3 ? '...' : ''
          }`,
        };
      }

      return { success: message };
    } catch (error) {
      console.error('Error importing master products:', error);
      return { error: 'Failed to import master products' };
    }
  }
);

// ============================================================
// ADD MASTER PRODUCTS TO TEAM
// ============================================================

/**
 * Add selected master products to user's team
 */
export const addMasterProductsToTeam = validatedActionWithUser(
  addMasterProductsToTeamSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      let added = 0;

      for (const item of data.products) {
        // Get master product details
        const masterProduct = await db
          .select()
          .from(masterProducts)
          .where(eq(masterProducts.id, item.masterProductId))
          .limit(1);

        if (masterProduct.length === 0) continue;

        const mp = masterProduct[0];

        // Create team product from master product
        await db.insert(products).values({
          teamId: team.id,
          name: mp.name,
          description: mp.description,
          sku: mp.defaultSku,
          barcode: mp.defaultBarcode,
          unit: mp.defaultUnit,
          productType: 'product',
          unitPrice: item.sellingPrice.toString(),
          defaultTaxRate: mp.defaultGstRate,
          isTaxExempt: false,
          gstClassification: mp.defaultTaxClassification as any,
          masterProductId: mp.id,
          trackInventory: true,
          stockQuantity: item.openingStock,
          lowStockThreshold: 5,
          isActive: true,
          createdBy: user.id,
        });

        added++;
      }

      // Activity log
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `${ActivityType.CREATE_PRODUCT}: Added ${added} products from catalog`,
        timestamp: new Date(),
      });

      revalidatePath('/products');
      revalidatePath('/products/catalog');
      return {
        success: `Successfully added ${added} products to your inventory`,
      };
    } catch (error) {
      console.error('Error adding master products to team:', error);
      return { error: 'Failed to add products to team' };
    }
  }
);