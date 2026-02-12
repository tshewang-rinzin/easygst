import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getGstReturnById } from '@/lib/gst/queries';
import { deleteGstReturn } from '@/lib/gst/actions';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const id = params.id;
    const gstReturn = await getGstReturnById(id);

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
});

export const DELETE = withAuth(async (request, { user, team, params }) => {
  try {
    const id = params.id;
    const result = await deleteGstReturn(id);

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
});
