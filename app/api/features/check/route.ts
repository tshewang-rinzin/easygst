import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { hasFeature } from '@/lib/features';

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Feature code required' }, { status: 400 });
  }

  const enabled = await hasFeature(code);
  return NextResponse.json({ enabled, code });
});
