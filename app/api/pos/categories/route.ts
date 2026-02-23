import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import { productCategories } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const GET = withMobileAuth(async (request: NextRequest, context: MobileAuthContext) => {
  const teamId = context.team.id;

  const categories = await db
    .select({
      id: productCategories.id,
      name: productCategories.name,
      parentId: productCategories.parentId,
    })
    .from(productCategories)
    .where(and(eq(productCategories.teamId, teamId), eq(productCategories.isActive, true)))
    .orderBy(asc(productCategories.sortOrder), asc(productCategories.name));

  return NextResponse.json({ categories });
});
