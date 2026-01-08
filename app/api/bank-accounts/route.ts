import { NextResponse } from 'next/server';
import { getBankAccounts } from '@/lib/bank-accounts/queries';

export async function GET() {
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
}
