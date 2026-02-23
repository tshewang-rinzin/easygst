import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage/r2';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import { fileAttachments } from '@/lib/db/schema';
import { getTeamFeatures } from '@/lib/features';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for POS
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const POST = withMobileAuth(async (
  request: NextRequest,
  { team, user }: MobileAuthContext
) => {
  const teamId = team.id;
  const userId = user.id;
  try {
    const teamFeatures = await getTeamFeatures(teamId);
    if (!teamFeatures.has('file_attachments')) {
      return NextResponse.json({ error: 'File attachments not available on your plan' }, { status: 403 });
    }
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'payment-proofs';
    const entityType = (formData.get('entityType') as string) || 'payment';
    const entityId = formData.get('entityId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB` },
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
        uploadedBy: userId,
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
    console.error('[pos/upload] Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});
