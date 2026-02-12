import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getCategories } from '@/lib/categories/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const categories = await getCategories(false);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
});
