import { db } from '@/lib/db/drizzle';
import { products, productVariants, inventoryMovements, users } from '@/lib/db/schema';
import { eq, and, desc, lt, or, gt, sql, asc } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all products with inventory info (products that track inventory)
 */
export async function getInventoryItems() {
  const team = await getTeamForUser();
  if (!team) return [];

  // Get products with trackInventory = true and no variants
  const trackedProducts = await db
    .select()
    .from(products)
    .where(and(
      eq(products.teamId, team.id),
      eq(products.isActive, true),
      eq(products.trackInventory, true),
      eq(products.productType, 'product')
    ))
    .orderBy(asc(products.name));

  // Get all active variants for tracked products
  const variants = await db
    .select({
      variant: productVariants,
      productName: products.name,
      productId: products.id,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(
      eq(productVariants.teamId, team.id),
      eq(productVariants.isActive, true),
      eq(products.isActive, true),
      eq(products.trackInventory, true),
    ))
    .orderBy(asc(products.name), asc(productVariants.name));

  return { trackedProducts, variants };
}

/**
 * Get low stock items (products + variants below threshold)
 */
export async function getLowStockItems() {
  const team = await getTeamForUser();
  if (!team) return { products: [], variants: [] };

  // Products below threshold (non-variant, tracking inventory)
  const lowStockProducts = await db
    .select()
    .from(products)
    .where(and(
      eq(products.teamId, team.id),
      eq(products.isActive, true),
      eq(products.trackInventory, true),
      eq(products.productType, 'product'),
      sql`${products.stockQuantity} <= ${products.lowStockThreshold}`
    ))
    .orderBy(asc(products.stockQuantity));

  // Variants below threshold
  const lowStockVariants = await db
    .select({
      variant: productVariants,
      productName: products.name,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(
      eq(productVariants.teamId, team.id),
      eq(productVariants.isActive, true),
      eq(products.isActive, true),
      eq(products.trackInventory, true),
      sql`${productVariants.stockQuantity} <= ${productVariants.lowStockThreshold}`
    ))
    .orderBy(asc(productVariants.stockQuantity));

  return { products: lowStockProducts, variants: lowStockVariants };
}

/**
 * Get inventory movements for a product (or variant)
 */
export async function getInventoryMovements(productId: string, variantId?: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [
    eq(inventoryMovements.teamId, team.id),
    eq(inventoryMovements.productId, productId),
  ];

  if (variantId) {
    conditions.push(eq(inventoryMovements.variantId, variantId));
  }

  return db
    .select({
      movement: inventoryMovements,
      userName: users.name,
    })
    .from(inventoryMovements)
    .leftJoin(users, eq(inventoryMovements.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(100);
}

/**
 * Get recent inventory movements for the team
 */
export async function getRecentMovements(limit = 20) {
  const team = await getTeamForUser();
  if (!team) return [];

  return db
    .select({
      movement: inventoryMovements,
      productName: products.name,
      variantName: productVariants.name,
      userName: users.name,
    })
    .from(inventoryMovements)
    .innerJoin(products, eq(inventoryMovements.productId, products.id))
    .leftJoin(productVariants, eq(inventoryMovements.variantId, productVariants.id))
    .leftJoin(users, eq(inventoryMovements.createdBy, users.id))
    .where(eq(inventoryMovements.teamId, team.id))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(limit);
}
