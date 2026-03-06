import { NextRequest, NextResponse } from 'next/server';
import { getPlatformAdmin } from '@/lib/db/queries';
import { sendTestEmail } from '@/lib/email/utils';

export async function POST(request: NextRequest) {
  const admin = await getPlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { email } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
  }

  const result = await sendTestEmail(email);

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ success: true, messageId: result.messageId });
}
