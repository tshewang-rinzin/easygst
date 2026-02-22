'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import { stockAdjustmentSchema } from './validation';
import { db } from '@/lib/db/drizzle';
import { products, productVariants, inventoryMovements } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Adjust stock for a product or variant
 */
export const adjustStock = validatedActionWithUser(
  stockAdjustmentSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Verify product belongs to team
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, data.productId), eq(products.teamId, team.id)))
        .limit(1);

      if (!product) return { error: 'Product not found' };

      // Determine quantity change
      let quantityChange = data.quantity;
      if (data.type === 'out') {
        quantityChange = -data.quantity;
      } else if (data.type === 'adjustment') {
        // adjustment sets absolute value handled differently — we use quantity as delta
        quantityChange = data.quantity; // positive or negative based on reason
      }

      if (data.variantId) {
        // Update variant stock
        await db
          .update(productVariants)
          .set({
            stockQuantity: sql`${productVariants.stockQuantity} + ${quantityChange}`,
          })
          .where(and(
            eq(productVariants.id, data.variantId),
            eq(productVariants.teamId, team.id)
          ));
      } else {
        // Update product stock
        await db
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} + ${quantityChange}`,
            updatedAt: new Date(),
          })
          .where(and(
            eq(products.id, data.productId),
            eq(products.teamId, team.id)
          ));
      }

      // Record movement
      await db.insert(inventoryMovements).values({
        teamId: team.id,
        productId: data.productId,
        variantId: data.variantId || null,
        type: data.type,
        quantity: data.type === 'out' ? -data.quantity : data.quantity,
        reason: data.reason,
        referenceType: data.referenceType,
        notes: data.notes || null,
        createdBy: user.id,
      });

      revalidatePath('/inventory');
      revalidatePath(`/products/${data.productId}`);
      return { success: 'Stock adjusted successfully' };
    } catch (error) {
      console.error('Error adjusting stock:', error);
      return { error: 'Failed to adjust stock' };
    }
  }
);

/**
 * Deduct inventory when an invoice is created
 * Called from invoice creation logic
 */
export async function deductInventoryForInvoice(
  teamId: string,
  userId: string,
  items: Array<{
    productId: string | null;
    variantId?: string | null;
    quantity: number;
  }>,
  invoiceId: string
) {
  for (const item of items) {
    if (!item.productId) continue;

    // Check if product tracks inventory
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, item.productId), eq(products.teamId, teamId)))
      .limit(1);

    if (!product || !product.trackInventory || product.productType === 'service') continue;

    const quantity = Math.abs(item.quantity);

    if (item.variantId) {
      await db
        .update(productVariants)
        .set({
          stockQuantity: sql`${productVariants.stockQuantity} - ${quantity}`,
        })
        .where(eq(productVariants.id, item.variantId));
    } else {
      await db
        .update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} - ${quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId));
    }

    // Record movement
    await db.insert(inventoryMovements).values({
      teamId,
      productId: item.productId,
      variantId: item.variantId || null,
      type: 'out',
      quantity: -quantity,
      reason: 'Invoice created',
      referenceType: 'invoice',
      referenceId: invoiceId,
      createdBy: userId,
    });
  }
}
