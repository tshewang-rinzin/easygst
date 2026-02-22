import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getProductWithVariants, getProductVariants } from '@/lib/products/queries';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;
    const product = await getProductWithVariants(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      attributes: product.attributes,
      variants: product.variants,
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
