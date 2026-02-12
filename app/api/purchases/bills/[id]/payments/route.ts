import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getSupplierBillPayments } from '@/lib/supplier-payments/queries';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    if (!params || !params.id) {
      return NextResponse.json({ error: 'Bill ID is required' }, { status: 400 });
    }

    const billId = params.id;

    const payments = await getSupplierBillPayments(billId);
    return NextResponse.json(payments || []);
  } catch (error) {
    console.error('Error fetching bill payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
});
