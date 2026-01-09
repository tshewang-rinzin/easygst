import { NextResponse } from 'next/server';
import { getGstReturns } from '@/lib/gst/queries';

export async function GET() {
  try {
    const returns = await getGstReturns();
    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching GST returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GST returns' },
      { status: 500 }
    );
  }
}
