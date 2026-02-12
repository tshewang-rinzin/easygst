import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getTaxClassifications } from '@/lib/tax-classifications/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const classifications = await getTaxClassifications();
    return NextResponse.json(classifications);
  } catch (error) {
    console.error('Error fetching tax classifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax classifications' },
      { status: 500 }
    );
  }
});
