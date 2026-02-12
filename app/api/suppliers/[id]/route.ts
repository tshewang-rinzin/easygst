import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getSupplierById } from '@/lib/suppliers/queries';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;
    const supplier = await getSupplierById(id);

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    );
  }
});
