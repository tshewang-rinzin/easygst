import { NextResponse } from 'next/server';
import { getPeriodLocks } from '@/lib/gst/queries';

export async function GET() {
  try {
    const locks = await getPeriodLocks();
    return NextResponse.json(locks);
  } catch (error) {
    console.error('Error fetching period locks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch period locks' },
      { status: 500 }
    );
  }
}
