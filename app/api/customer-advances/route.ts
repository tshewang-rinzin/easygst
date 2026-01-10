import { NextResponse } from 'next/server';
import { getCustomerAdvances } from '@/lib/customer-payments/queries';
import { recordCustomerAdvance } from '@/lib/customer-payments/actions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    const advances = await getCustomerAdvances(
      customerId ? parseInt(customerId) : undefined
    );
    return NextResponse.json(advances);
  } catch (error) {
    console.error('Error fetching customer advances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer advances' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await recordCustomerAdvance(body);

    if ('error' in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if ('success' in result && result.success) {
      return NextResponse.json({ success: result.success });
    }

    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  } catch (error) {
    console.error('Error creating customer advance:', error);
    return NextResponse.json(
      { error: 'Failed to create advance' },
      { status: 500 }
    );
  }
}
