import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getPurchaseRegister, getPurchaseRegisterSummary } from '@/lib/reports/purchase-register';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const [entries, summary] = await Promise.all([
      getPurchaseRegister(startDate, endDate),
      getPurchaseRegisterSummary(startDate, endDate),
    ]);

    return NextResponse.json({
      entries,
      summary,
    });
  } catch (error) {
    console.error('Error fetching purchase register:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase register' },
      { status: 500 }
    );
  }
});
