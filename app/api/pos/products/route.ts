import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import { products, productCategories, units } from '@/lib/db/schema';
import { eq, and, ilike, asc, or } from 'drizzle-orm';

export const GET = withMobileAuth(async (request: NextRequest, context: MobileAuthContext) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const categoryId = searchParams.get('categoryId');
  const barcode = searchParams.get('barcode');
  const teamId = context.team.id;

  const conditions = [eq(products.teamId, teamId), eq(products.isActive, true)];

  if (barcode) {
    conditions.push(eq(products.barcode, barcode));
  } else if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(products.name, pattern),
        ilike(products.sku, pattern),
        ilike(products.description, pattern)
      )!
    );
  }

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      barcode: products.barcode,
      price: products.unitPrice,
      categoryId: products.categoryId,
      categoryName: productCategories.name,
      productType: products.productType,
      trackInventory: products.trackInventory,
      stockQuantity: products.stockQuantity,
      unit: products.unit,
      defaultTaxRate: products.defaultTaxRate,
      isTaxExempt: products.isTaxExempt,
    })
    .from(products)
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(...conditions))
    .orderBy(asc(products.name));

  return NextResponse.json({ products: rows });
});
