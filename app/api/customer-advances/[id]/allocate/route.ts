import { NextResponse } from 'next/server';
import { allocateCustomerAdvance } from '@/lib/customer-payments/actions';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const advanceId = parseInt(id);
    const body = await request.json();

    const result = await allocateCustomerAdvance({
      advanceId,
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
    console.error('Error allocating customer advance:', error);
    return NextResponse.json(
      { error: 'Failed to allocate advance' },
      { status: 500 }
    );
  }
}
