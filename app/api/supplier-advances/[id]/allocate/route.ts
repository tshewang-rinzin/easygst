import { NextResponse } from 'next/server';
import { allocateSupplierAdvance } from '@/lib/supplier-payments/actions';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const advanceId = parseInt(id);
    const body = await request.json();

    const result = await allocateSupplierAdvance({
      advanceId,
      allocations: body.allocations,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: result.success });
  } catch (error) {
    console.error('Error allocating supplier advance:', error);
    return NextResponse.json(
      { error: 'Failed to allocate advance' },
      { status: 500 }
    );
  }
}
