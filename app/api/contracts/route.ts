import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getContracts } from '@/lib/contracts/queries';

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') as 'project' | 'amc' | undefined;
    const status = searchParams.get('status') || undefined;
    const customerId = searchParams.get('customerId') || undefined;

    const contracts = await getContracts({ search, type, status, customerId });
    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
});
