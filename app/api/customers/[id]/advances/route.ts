import { NextResponse } from 'next/server';
import { getCustomerAdvances, getCustomerUnallocatedAdvances } from '@/lib/customer-payments/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const unallocatedOnly = searchParams.get('unallocatedOnly') === 'true';

    const advances = unallocatedOnly
      ? await getCustomerUnallocatedAdvances(customerId)
      : await getCustomerAdvances(customerId);

    return NextResponse.json(advances);
  } catch (error) {
    console.error('Error fetching customer advances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advances' },
      { status: 500 }
    );
  }
}
