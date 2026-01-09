import { NextResponse } from 'next/server';
import { getCurrentPeriodGstSummary } from '@/lib/gst/queries';

export async function GET() {
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
}
