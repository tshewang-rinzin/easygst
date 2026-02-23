import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage/r2';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { fileAttachments } from '@/lib/db/schema';
import { getTeamFeatures } from '@/lib/features';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'text/csv',
];

export const POST = withAuth(async (request: NextRequest, { team, user }: any) => {
  const teamId = team.id;
  try {
    const teamFeatures = await getTeamFeatures(teamId);
    if (!teamFeatures.has('file_attachments')) {
      return NextResponse.json({ error: 'File attachments not available on your plan' }, { status: 403 });
    }
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';
    const entityType = (formData.get('entityType') as string) || 'general';
    const entityId = formData.get('entityId') as string | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" not allowed` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadFile(buffer, {
      filename: file.name,
      contentType: file.type,
      folder,
      teamId,
    });

    // Save to file_attachments table
    const [attachment] = await db
      .insert(fileAttachments)
      .values({
        teamId,
        storageKey: result.key,
        filename: file.name,
        contentType: file.type,
        fileSize: result.size,
        folder,
        entityType,
        entityId: entityId || '00000000-0000-0000-0000-000000000000',
        description,
        uploadedBy: user.id,
      })
      .returning();

    return NextResponse.json({
      id: attachment.id,
      key: result.key,
      filename: file.name,
      size: result.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('[upload] Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});
