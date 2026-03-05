import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('[api/user] Step 1: Route handler entered');

  try {
    console.log('[api/user] Step 2: Importing env...');
    const { env } = await import('@/lib/env');
    console.log('[api/user] Step 3: env loaded, POSTGRES_URL exists:', !!env.POSTGRES_URL);

    console.log('[api/user] Step 4: Importing db...');
    const { db } = await import('@/lib/db/drizzle');
    console.log('[api/user] Step 5: db imported');

    console.log('[api/user] Step 6: Importing getUser...');
    const { getUser, getTeamForUser, getUserTeamRole } = await import('@/lib/db/queries');
    console.log('[api/user] Step 7: queries imported');

    console.log('[api/user] Step 8: Calling getUser()...');
    const user = await getUser();
    console.log('[api/user] Step 9: getUser result:', user ? 'found' : 'null');

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('[api/user] ERROR at some step:', error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
