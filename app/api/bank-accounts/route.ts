import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getBankAccounts } from '@/lib/bank-accounts/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const accounts = await getBankAccounts();
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank accounts' },
      { status: 500 }
    );
  }
});
