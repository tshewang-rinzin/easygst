import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { allocateSupplierAdvance } from '@/lib/supplier-payments/actions';

export const POST = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;
    const body = await request.json();

    const result = await allocateSupplierAdvance({
      advanceId: id,
      allocations: body.allocations,
    });

    if ('error' in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if ('success' in result && result.success) {
      return NextResponse.json({ success: result.success });
    }

    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  } catch (error) {
    console.error('Error allocating supplier advance:', error);
    return NextResponse.json(
      { error: 'Failed to allocate advance' },
      { status: 500 }
    );
  }
});
