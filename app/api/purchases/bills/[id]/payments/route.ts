import { NextRequest, NextResponse } from 'next/server';
import { getSupplierBillPayments } from '@/lib/supplier-payments/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ error: 'Bill ID is required' }, { status: 400 });
    }

    const billId = resolvedParams.id;

    const payments = await getSupplierBillPayments(billId);
    return NextResponse.json(payments || []);
  } catch (error) {
    console.error('Error fetching bill payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
