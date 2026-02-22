import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { messageLog } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const GET = withAuth(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel');
  const messageType = searchParams.get('messageType');
  const invoiceId = searchParams.get('invoiceId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  const conditions = [eq(messageLog.teamId, context.team.id)];

  if (channel) {
    conditions.push(eq(messageLog.channel, channel));
  }
  if (messageType) {
    conditions.push(eq(messageLog.messageType, messageType));
  }
  if (invoiceId) {
    conditions.push(eq(messageLog.invoiceId, invoiceId));
  }

  const messages = await db
    .select()
    .from(messageLog)
    .where(and(...conditions))
    .orderBy(desc(messageLog.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ messages });
});
