import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  return NextResponse.json(team);
});
