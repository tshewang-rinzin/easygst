import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { products, productVariants } from '@/lib/db/schema';
import { eq, and, or, ilike, inArray } from 'drizzle-orm';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Search parent products
    const productResults = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        sku: products.sku,
        unitPrice: products.unitPrice,
        unit: products.unit,
        defaultTaxRate: products.defaultTaxRate,
        isTaxExempt: products.isTaxExempt,
      })
      .from(products)
      .where(
        and(
          eq(products.teamId, team.id),
          eq(products.isActive, true),
          or(
            ilike(products.name, `%${query}%`),
            ilike(products.description, `%${query}%`),
            ilike(products.sku, `%${query}%`)
          )
        )
      )
      .limit(10);

    // Also find products whose variants match the search query
    const variantMatchProducts = await db
      .select({
        productId: productVariants.productId,
      })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.teamId, team.id),
          eq(productVariants.isActive, true),
          or(
            ilike(productVariants.name, `%${query}%`),
            ilike(productVariants.sku, `%${query}%`)
          )
        )
      )
      .limit(10);

    // Merge product IDs (from direct match + variant match)
    const matchedProductIds = new Set(productResults.map((p) => p.id));
    const variantMatchProductIds = variantMatchProducts
      .map((v) => v.productId)
      .filter((id) => !matchedProductIds.has(id));

    // Fetch additional products found via variant search
    let additionalProducts: typeof productResults = [];
    if (variantMatchProductIds.length > 0) {
      additionalProducts = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          sku: products.sku,
          unitPrice: products.unitPrice,
          unit: products.unit,
          defaultTaxRate: products.defaultTaxRate,
          isTaxExempt: products.isTaxExempt,
        })
        .from(products)
        .where(
          and(
            eq(products.teamId, team.id),
            eq(products.isActive, true),
            inArray(products.id, variantMatchProductIds)
          )
        );
    }

    const allProducts = [...productResults, ...additionalProducts];
    const allProductIds = allProducts.map((p) => p.id);

    // Fetch active variants for all matched products
    let variants: Array<{
      id: string;
      productId: string;
      name: string;
      sku: string | null;
      barcode: string | null;
      unitPrice: string | null;
      costPrice: string | null;
      attributeValues: unknown;
      isActive: boolean;
    }> = [];

    if (allProductIds.length > 0) {
      variants = await db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          name: productVariants.name,
          sku: productVariants.sku,
          barcode: productVariants.barcode,
          unitPrice: productVariants.unitPrice,
          costPrice: productVariants.costPrice,
          attributeValues: productVariants.attributeValues,
          isActive: productVariants.isActive,
        })
        .from(productVariants)
        .where(
          and(
            eq(productVariants.teamId, team.id),
            eq(productVariants.isActive, true),
            inArray(productVariants.productId, allProductIds)
          )
        );
    }

    // Group variants by productId
    const variantsByProduct = new Map<string, typeof variants>();
    for (const v of variants) {
      const list = variantsByProduct.get(v.productId) || [];
      list.push(v);
      variantsByProduct.set(v.productId, list);
    }

    // Build response with nested variants
    const results = allProducts.map((product) => ({
      ...product,
      variants: variantsByProduct.get(product.id) || [],
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 });
  }
});
