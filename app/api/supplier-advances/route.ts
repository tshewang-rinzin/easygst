import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getSupplierAdvances } from '@/lib/supplier-payments/queries';
import { recordSupplierAdvance } from '@/lib/supplier-payments/actions';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');

    const advances = await getSupplierAdvances(supplierId || undefined);
    return NextResponse.json(advances);
  } catch (error) {
    console.error('Error fetching supplier advances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier advances' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request, { user, team }) => {
  try {
    const body = await request.json();
    const result = await recordSupplierAdvance(body);

    if ('error' in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if ('success' in result && result.success) {
      return NextResponse.json({ success: result.success });
    }

    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  } catch (error) {
    console.error('Error creating supplier advance:', error);
    return NextResponse.json(
      { error: 'Failed to create advance' },
      { status: 500 }
    );
  }
});
