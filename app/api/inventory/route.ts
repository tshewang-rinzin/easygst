import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getInventoryItems, getLowStockItems, getRecentMovements } from '@/lib/inventory/queries';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    if (type === 'low-stock') {
      const lowStock = await getLowStockItems();
      return NextResponse.json(lowStock);
    }

    if (type === 'movements') {
      const movements = await getRecentMovements();
      return NextResponse.json(movements);
    }

    const items = await getInventoryItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
});
