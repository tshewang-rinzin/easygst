import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/storage/r2';
import { withAuth } from '@/lib/auth/with-auth';

export const GET = withAuth(async (
  request: NextRequest,
  { team }: any,
) => {
  const teamId = team.id;
  try {
    const url = new URL(request.url);
    // Extract key from /api/files/TEAM_ID/folder/filename
    const key = url.pathname.replace('/api/files/', '');

    if (!key) {
      return NextResponse.json({ error: 'File key required' }, { status: 400 });
    }

    // Security: ensure the file belongs to this team
    if (!key.startsWith(`${teamId}/`) && !key.startsWith('_global/')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const signedUrl = await getFileUrl(key);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('[files] Error:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
});
