import { NextResponse } from 'next/server';
import { getSupplierAdvances, getSupplierUnallocatedAdvances } from '@/lib/supplier-payments/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const unallocatedOnly = searchParams.get('unallocatedOnly') === 'true';

    const advances = unallocatedOnly
      ? await getSupplierUnallocatedAdvances(id)
      : await getSupplierAdvances(id);

    return NextResponse.json(advances);
  } catch (error) {
    console.error('Error fetching supplier advances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advances' },
      { status: 500 }
    );
  }
}
