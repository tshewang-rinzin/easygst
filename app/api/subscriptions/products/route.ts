import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { products } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  try {
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        unitPrice: products.unitPrice,
        billingCycle: products.billingCycle,
        unit: products.unit,
        defaultTaxRate: products.defaultTaxRate,
        isTaxExempt: products.isTaxExempt,
        gstClassification: products.gstClassification,
      })
      .from(products)
      .where(
        and(
          eq(products.teamId, team.id),
          eq(products.isActive, true),
          eq(products.productType, 'service'),
          isNotNull(products.billingCycle)
        )
      );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching subscription products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
});
