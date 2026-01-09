import { NextResponse } from 'next/server';
import { getExemptAndZeroRatedTransactions, getExemptZeroRatedSummary } from '@/lib/reports/exempt-zero-rated';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const [transactions, summary] = await Promise.all([
      getExemptAndZeroRatedTransactions(startDate, endDate),
      getExemptZeroRatedSummary(startDate, endDate),
    ]);

    return NextResponse.json({ transactions, summary });
  } catch (error) {
    console.error('Error fetching exempt/zero-rated report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exempt/zero-rated report' },
      { status: 500 }
    );
  }
}
