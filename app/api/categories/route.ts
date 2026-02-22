import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getCategories, getCategoryTree, getActiveCategoriesForDropdown } from '@/lib/categories/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format');

    if (format === 'tree') {
      const tree = await getCategoryTree(false);
      return NextResponse.json(tree);
    }

    if (format === 'dropdown') {
      const dropdown = await getActiveCategoriesForDropdown();
      return NextResponse.json(dropdown);
    }

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
