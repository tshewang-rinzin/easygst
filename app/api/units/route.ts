import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getUnits } from '@/lib/units/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const units = await getUnits();
    return NextResponse.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
  }
});
