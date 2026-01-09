import { NextResponse } from 'next/server';
import { getCustomerAdvanceById } from '@/lib/customer-payments/queries';
import { deleteCustomerAdvance } from '@/lib/customer-payments/actions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const advanceId = parseInt(id);

    const advance = await getCustomerAdvanceById(advanceId);

    if (!advance) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    return NextResponse.json(advance);
  } catch (error) {
    console.error('Error fetching customer advance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advance' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const advanceId = parseInt(id);

    const result = await deleteCustomerAdvance({ id: advanceId });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: result.success });
  } catch (error) {
    console.error('Error deleting customer advance:', error);
    return NextResponse.json(
      { error: 'Failed to delete advance' },
      { status: 500 }
    );
  }
}
