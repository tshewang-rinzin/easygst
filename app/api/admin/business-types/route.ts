import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { businessTypes } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getPlatformAdmin } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    // Check if user is platform admin
    const admin = await getPlatformAdmin();
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessTypesList = await db
      .select({
        id: businessTypes.id,
        name: businessTypes.name,
        slug: businessTypes.slug,
        description: businessTypes.description,
        icon: businessTypes.icon,
        isActive: businessTypes.isActive,
        createdAt: businessTypes.createdAt,
      })
      .from(businessTypes)
      .orderBy(desc(businessTypes.createdAt));

    return Response.json({ businessTypes: businessTypesList });
  } catch (error) {
    console.error('Error fetching business types:', error);
    return Response.json(
      { error: 'Failed to fetch business types' },
      { status: 500 }
    );
  }
}