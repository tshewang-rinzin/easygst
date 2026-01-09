import { NextResponse } from 'next/server';
import { getGstReturnById } from '@/lib/gst/queries';
import { deleteGstReturn } from '@/lib/gst/actions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gstReturn = await getGstReturnById(parseInt(id));

    if (!gstReturn) {
      return NextResponse.json({ error: 'GST return not found' }, { status: 404 });
    }

    return NextResponse.json(gstReturn);
  } catch (error) {
    console.error('Error fetching GST return:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GST return' },
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
    const result = await deleteGstReturn(parseInt(id));

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting GST return:', error);
    return NextResponse.json(
      { error: 'Failed to delete GST return' },
      { status: 500 }
    );
  }
}
