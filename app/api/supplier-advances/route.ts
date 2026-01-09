import { NextResponse } from 'next/server';
import { getSupplierAdvances } from '@/lib/supplier-payments/queries';
import { recordSupplierAdvance } from '@/lib/supplier-payments/actions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');

    const advances = await getSupplierAdvances(
      supplierId ? parseInt(supplierId) : undefined
    );
    return NextResponse.json(advances);
  } catch (error) {
    console.error('Error fetching supplier advances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier advances' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await recordSupplierAdvance(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: result.success });
  } catch (error) {
    console.error('Error creating supplier advance:', error);
    return NextResponse.json(
      { error: 'Failed to create advance' },
      { status: 500 }
    );
  }
}
