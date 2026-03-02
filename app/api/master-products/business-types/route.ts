import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { businessTypes } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const businessTypesList = await db
      .select({
        id: businessTypes.id,
        name: businessTypes.name,
        slug: businessTypes.slug,
        description: businessTypes.description,
        icon: businessTypes.icon,
        isActive: businessTypes.isActive,
      })
      .from(businessTypes)
      .where(eq(businessTypes.isActive, true))
      .orderBy(asc(businessTypes.name));

    return Response.json({ businessTypes: businessTypesList });
  } catch (error) {
    console.error('Error fetching business types:', error);
    return Response.json(
      { error: 'Failed to fetch business types' },
      { status: 500 }
    );
  }
});