import { NextResponse } from 'next/server';
import { getSupplierBills } from '@/lib/supplier-bills/queries';

export async function GET() {
  try {
    const bills = await getSupplierBills();
    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error fetching supplier bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier bills' },
      { status: 500 }
    );
  }
}
