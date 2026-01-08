import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/categories/queries';

export async function GET() {
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
}
