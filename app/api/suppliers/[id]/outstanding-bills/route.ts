import { NextResponse } from 'next/server';
import { getSupplierOutstandingBills } from '@/lib/supplier-payments/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bills = await getSupplierOutstandingBills(id);

    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error fetching outstanding bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outstanding bills' },
      { status: 500 }
    );
  }
}
