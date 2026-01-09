import { NextResponse } from 'next/server';
import { getCustomerPayments } from '@/lib/customer-payments/queries';

export async function GET() {
  try {
    const payments = await getCustomerPayments();
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer payments' },
      { status: 500 }
    );
  }
}
