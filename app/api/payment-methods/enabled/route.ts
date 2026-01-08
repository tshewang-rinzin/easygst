import { NextResponse } from 'next/server';
import { getEnabledPaymentMethods } from '@/lib/payment-methods/queries';

export async function GET() {
  try {
    const methods = await getEnabledPaymentMethods();
    return NextResponse.json(methods);
  } catch (error) {
    console.error('Error fetching enabled payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}
