import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getProductById } from '@/lib/products/queries';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;

    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
