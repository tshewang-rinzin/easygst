import { NextResponse } from 'next/server';
import { getUnits } from '@/lib/units/queries';

export async function GET() {
  try {
    const units = await getUnits();
    return NextResponse.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
  }
}
