import { NextRequest, NextResponse } from 'next/server';
import { searchSuppliers } from '@/lib/suppliers/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    const suppliers = await searchSuppliers(query);
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error searching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to search suppliers' },
      { status: 500 }
    );
  }
}
