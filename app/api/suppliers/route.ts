import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getSuppliers } from '@/lib/suppliers/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const suppliers = await getSuppliers();
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
});
