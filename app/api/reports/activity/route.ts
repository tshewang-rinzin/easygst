import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getActivityLogs, getActivitySummary, getActivityBreakdown } from '@/lib/reports/activity';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    const [logs, summary, breakdown] = await Promise.all([
      getActivityLogs(startDate, endDate, limit),
      getActivitySummary(startDate, endDate),
      getActivityBreakdown(startDate, endDate),
    ]);

    return NextResponse.json({ logs, summary, breakdown });
  } catch (error) {
    console.error('Error fetching activity report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity report' },
      { status: 500 }
    );
  }
});
