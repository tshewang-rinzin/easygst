import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getSupplierBillById } from '@/lib/supplier-bills/queries';

export const GET = withAuth(async (request: NextRequest, { params }) => {
  try {
    const bill = await getSupplierBillById(params.id);

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error fetching supplier bill:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
