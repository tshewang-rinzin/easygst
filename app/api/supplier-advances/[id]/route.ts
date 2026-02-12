import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getSupplierAdvanceById } from '@/lib/supplier-payments/queries';
import { deleteSupplierAdvance } from '@/lib/supplier-payments/actions';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;

    const advance = await getSupplierAdvanceById(id);

    if (!advance) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    return NextResponse.json(advance);
  } catch (error) {
    console.error('Error fetching supplier advance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advance' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;

    const result = await deleteSupplierAdvance({ id });

    if ('error' in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if ('success' in result && result.success) {
      return NextResponse.json({ success: result.success });
    }

    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  } catch (error) {
    console.error('Error deleting supplier advance:', error);
    return NextResponse.json(
      { error: 'Failed to delete advance' },
      { status: 500 }
    );
  }
});
