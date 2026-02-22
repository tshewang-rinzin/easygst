import { db } from '@/lib/db/drizzle';
import { products, productAttributeDefinitions, productVariants } from '@/lib/db/schema';
import { eq, and, ilike, desc, or, asc, sql, count } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all active products for the current team
 * Optionally filter by search term (searches name, sku, description)
 */
export async function getProducts(searchTerm?: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  const baseWhere = searchTerm
    ? and(
        eq(products.teamId, team.id),
        eq(products.isActive, true),
        or(
          ilike(products.name, `%${searchTerm}%`),
          ilike(products.sku, `%${searchTerm}%`),
          ilike(products.description, `%${searchTerm}%`)
        )
      )
    : and(eq(products.teamId, team.id), eq(products.isActive, true));

  const rows = await db
    .select({
      id: products.id,
      teamId: products.teamId,
      name: products.name,
      description: products.description,
      sku: products.sku,
      unit: products.unit,
      productType: products.productType,
      unitPrice: products.unitPrice,
      defaultTaxRate: products.defaultTaxRate,
      isTaxExempt: products.isTaxExempt,
      gstClassification: products.gstClassification,
      categoryId: products.categoryId,
      category: products.category,
      trackInventory: products.trackInventory,
      stockQuantity: products.stockQuantity,
      lowStockThreshold: products.lowStockThreshold,
      barcode: products.barcode,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      createdBy: products.createdBy,
      variantCount: sql<number>`(SELECT count(*) FROM product_variants WHERE product_variants.product_id = ${products.id} AND product_variants.is_active = true)`.as('variant_count'),
    })
    .from(products)
    .where(baseWhere)
    .orderBy(desc(products.createdAt));

  return rows;
}

/**
 * Get a single product by ID (scoped to team)
 */
export async function getProductById(id: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.teamId, team.id)))
    .limit(1);

  return product || null;
}

/**
 * Get product with variants and attributes
 */
export async function getProductWithVariants(id: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.teamId, team.id)))
    .limit(1);

  if (!product) return null;

  const attributes = await db
    .select()
    .from(productAttributeDefinitions)
    .where(and(
      eq(productAttributeDefinitions.productId, id),
      eq(productAttributeDefinitions.teamId, team.id)
    ))
    .orderBy(asc(productAttributeDefinitions.sortOrder));

  const variants = await db
    .select()
    .from(productVariants)
    .where(and(
      eq(productVariants.productId, id),
      eq(productVariants.teamId, team.id)
    ))
    .orderBy(asc(productVariants.name));

  return { ...product, attributes, variants };
}

/**
 * Get variants for a product
 */
export async function getProductVariants(productId: string) {
  const team = await getTeamForUser();
  if (!team) return [];

  return db
    .select()
    .from(productVariants)
    .where(and(
      eq(productVariants.productId, productId),
      eq(productVariants.teamId, team.id),
      eq(productVariants.isActive, true)
    ))
    .orderBy(asc(productVariants.name));
}

/**
 * Count total products for the current team
 */
export async function getProductCount() {
  const team = await getTeamForUser();
  if (!team) return 0;

  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.teamId, team.id), eq(products.isActive, true)));

  return result.length;
}
