import { NextRequest, NextResponse } from 'next/server';
import { getSalesRegister, getSalesRegisterSummary } from '@/lib/reports/sales-register';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const [entries, summary] = await Promise.all([
      getSalesRegister(startDate, endDate),
      getSalesRegisterSummary(startDate, endDate),
    ]);

    return NextResponse.json({
      entries,
      summary,
    });
  } catch (error) {
    console.error('Error fetching sales register:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales register' },
      { status: 500 }
    );
  }
}
