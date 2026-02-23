import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { fileAttachments, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getFileUrl, deleteFile } from '@/lib/storage/r2';

// GET /api/attachments?entityType=invoice&entityId=xxx
export const GET = withAuth(async (request: NextRequest, { team }: any) => {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');

  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entityType and entityId required' }, { status: 400 });
  }

  const attachments = await db
    .select({
      id: fileAttachments.id,
      storageKey: fileAttachments.storageKey,
      filename: fileAttachments.filename,
      contentType: fileAttachments.contentType,
      fileSize: fileAttachments.fileSize,
      folder: fileAttachments.folder,
      description: fileAttachments.description,
      createdAt: fileAttachments.createdAt,
      uploadedByName: users.name,
    })
    .from(fileAttachments)
    .leftJoin(users, eq(fileAttachments.uploadedBy, users.id))
    .where(
      and(
        eq(fileAttachments.teamId, team.id),
        eq(fileAttachments.entityType, entityType),
        eq(fileAttachments.entityId, entityId)
      )
    )
    .orderBy(desc(fileAttachments.createdAt));

  // Generate signed URLs
  const withUrls = await Promise.all(
    attachments.map(async (a) => ({
      ...a,
      url: await getFileUrl(a.storageKey),
    }))
  );

  return NextResponse.json(withUrls);
});

// DELETE /api/attachments?id=xxx
export const DELETE = withAuth(async (request: NextRequest, { team }: any) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Attachment id required' }, { status: 400 });
  }

  const [attachment] = await db
    .select()
    .from(fileAttachments)
    .where(and(eq(fileAttachments.id, id), eq(fileAttachments.teamId, team.id)))
    .limit(1);

  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  // Delete from R2
  await deleteFile(attachment.storageKey);

  // Delete from DB
  await db.delete(fileAttachments).where(eq(fileAttachments.id, id));

  return NextResponse.json({ success: true });
});
