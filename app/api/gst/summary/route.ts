import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getCurrentPeriodGstSummary } from '@/lib/gst/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const summary = await getCurrentPeriodGstSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching GST summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GST summary' },
      { status: 500 }
    );
  }
});
