import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
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

// Allowed upload folders — prevents directory traversal
const ALLOWED_FOLDERS = ['uploads', 'invoices', 'logos', 'attachments', 'receipts', 'contracts'];

// File signature magic bytes for content validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return true; // Skip check for types without known signatures (office docs, csv)
  return signatures.some(sig =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

function sanitizeFilename(filename: string): string {
  // Extract basename to prevent directory traversal
  const base = path.basename(filename);
  // Remove dangerous characters, keep alphanumeric, dots, hyphens, underscores
  return base.replace(/[^a-zA-Z0-9.\-_]/g, '_').substring(0, 255);
}

export const POST = withAuth(async (request: NextRequest, { team, user }: any) => {
  const teamId = team.id;
  try {
    const teamFeatures = await getTeamFeatures(teamId);
    if (!teamFeatures.has('file_attachments')) {
      return NextResponse.json({ error: 'File attachments not available on your plan' }, { status: 403 });
    }
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawFolder = (formData.get('folder') as string) || 'uploads';
    const entityType = (formData.get('entityType') as string) || 'general';
    const entityId = formData.get('entityId') as string | null;
    const description = formData.get('description') as string | null;

    // Validate folder — prevent directory traversal
    const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : 'uploads';

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
        { error: `File type not allowed` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate file content matches declared MIME type
    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File content does not match declared type' },
        { status: 400 }
      );
    }

    // Sanitize filename
    const safeFilename = sanitizeFilename(file.name);

    const result = await uploadFile(buffer, {
      filename: safeFilename,
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
        filename: safeFilename,
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
      filename: safeFilename,
      size: result.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('[upload] Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});
