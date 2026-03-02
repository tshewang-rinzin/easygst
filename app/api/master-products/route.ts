import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  masterProducts, 
  masterProductCategories, 
  businessTypes 
} from '@/lib/db/schema';
import { eq, and, like, desc, asc } from 'drizzle-orm';
import { withAuth } from '@/lib/auth/with-auth';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const businessTypeId = searchParams.get('businessTypeId');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    let whereConditions = [eq(masterProducts.isActive, true)];

    // Filter by business type
    if (businessTypeId) {
      whereConditions.push(eq(masterProducts.businessTypeId, businessTypeId));
    }

    // Filter by category
    if (categoryId) {
      whereConditions.push(eq(masterProducts.categoryId, categoryId));
    }

    // Search by name, SKU, or barcode
    if (search) {
      whereConditions.push(
        like(masterProducts.name, `%${search}%`)
      );
    }

    const products = await db
      .select({
        id: masterProducts.id,
        name: masterProducts.name,
        description: masterProducts.description,
        defaultSku: masterProducts.defaultSku,
        defaultBarcode: masterProducts.defaultBarcode,
        defaultUnit: masterProducts.defaultUnit,
        defaultGstRate: masterProducts.defaultGstRate,
        defaultTaxClassification: masterProducts.defaultTaxClassification,
        imageUrl: masterProducts.imageUrl,
        businessTypeId: masterProducts.businessTypeId,
        categoryId: masterProducts.categoryId,
        createdAt: masterProducts.createdAt,
        businessTypeName: businessTypes.name,
        categoryName: masterProductCategories.name,
      })
      .from(masterProducts)
      .innerJoin(businessTypes, eq(masterProducts.businessTypeId, businessTypes.id))
      .innerJoin(masterProductCategories, eq(masterProducts.categoryId, masterProductCategories.id))
      .where(and(...whereConditions))
      .orderBy(asc(masterProducts.name))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: masterProducts.id })
      .from(masterProducts)
      .innerJoin(businessTypes, eq(masterProducts.businessTypeId, businessTypes.id))
      .innerJoin(masterProductCategories, eq(masterProducts.categoryId, masterProductCategories.id))
      .where(and(...whereConditions));

    return Response.json({
      products,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        pages: Math.ceil(totalCount.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching master products:', error);
    return Response.json(
      { error: 'Failed to fetch master products' },
      { status: 500 }
    );
  }
});