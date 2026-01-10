import { NextRequest, NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { products } from '@/lib/db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const results = await db
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

    return NextResponse.json(results);
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 });
  }
}
