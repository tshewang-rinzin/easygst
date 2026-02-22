import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { features } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getPlatformAdmin } from '@/lib/db/queries';

export async function GET() {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allFeatures = await db.select().from(features).orderBy(features.module, features.sortOrder);
  return NextResponse.json(allFeatures);
}

export async function POST(request: NextRequest) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { code, name, description, module, sortOrder } = body;

  if (!code || !name || !module) {
    return NextResponse.json({ error: 'code, name, and module are required' }, { status: 400 });
  }

  const [feature] = await db.insert(features).values({
    code,
    name,
    description: description || null,
    module,
    sortOrder: sortOrder || 0,
  }).returning();

  return NextResponse.json(feature);
}
