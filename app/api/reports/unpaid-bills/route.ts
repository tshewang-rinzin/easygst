import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getUnpaidBills, getUnpaidBillsSummary } from '@/lib/reports/unpaid-bills';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const [bills, summary] = await Promise.all([
      getUnpaidBills(),
      getUnpaidBillsSummary(),
    ]);

    return NextResponse.json({ bills, summary });
  } catch (error) {
    console.error('Error fetching unpaid bills report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unpaid bills report' },
      { status: 500 }
    );
  }
});
