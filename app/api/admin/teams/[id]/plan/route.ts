import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { teams, teamFeatureOverrides } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getPlatformAdmin } from '@/lib/db/queries';

// Assign plan to team
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { planId } = body;

  await db.update(teams).set({ planId: planId || null, updatedAt: new Date() }).where(eq(teams.id, id));
  return NextResponse.json({ success: true });
}

// Get team feature overrides
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const overrides = await db.select().from(teamFeatureOverrides).where(eq(teamFeatureOverrides.teamId, id));
  return NextResponse.json(overrides);
}

// Set feature override for team
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { featureCode, enabled, reason } = body;

  if (!featureCode || enabled === undefined) {
    return NextResponse.json({ error: 'featureCode and enabled are required' }, { status: 400 });
  }

  // Upsert override
  const [existing] = await db.select().from(teamFeatureOverrides)
    .where(and(eq(teamFeatureOverrides.teamId, id), eq(teamFeatureOverrides.featureCode, featureCode)))
    .limit(1);

  if (existing) {
    await db.update(teamFeatureOverrides)
      .set({ enabled, reason: reason || null })
      .where(eq(teamFeatureOverrides.id, existing.id));
  } else {
    await db.insert(teamFeatureOverrides).values({
      teamId: id,
      featureCode,
      enabled,
      reason: reason || null,
    });
  }

  return NextResponse.json({ success: true });
}

// Delete feature override
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const featureCode = searchParams.get('featureCode');

  if (!featureCode) return NextResponse.json({ error: 'featureCode required' }, { status: 400 });

  await db.delete(teamFeatureOverrides)
    .where(and(eq(teamFeatureOverrides.teamId, id), eq(teamFeatureOverrides.featureCode, featureCode)));

  return NextResponse.json({ success: true });
}
