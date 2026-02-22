import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { plans, planFeatures } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getPlatformAdmin } from '@/lib/db/queries';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, description, isDefault, maxUsers, maxInvoicesPerMonth, maxProducts, maxCustomers, monthlyPrice, yearlyPrice, sortOrder, featureIds } = body;

  // If setting as default, unset others
  if (isDefault) {
    await db.update(plans).set({ isDefault: false }).where(eq(plans.isDefault, true));
  }

  await db.update(plans).set({
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(isDefault !== undefined && { isDefault }),
    ...(maxUsers !== undefined && { maxUsers: maxUsers || null }),
    ...(maxInvoicesPerMonth !== undefined && { maxInvoicesPerMonth: maxInvoicesPerMonth || null }),
    ...(maxProducts !== undefined && { maxProducts: maxProducts || null }),
    ...(maxCustomers !== undefined && { maxCustomers: maxCustomers || null }),
    ...(monthlyPrice !== undefined && { monthlyPrice: monthlyPrice?.toString() || '0' }),
    ...(yearlyPrice !== undefined && { yearlyPrice: yearlyPrice?.toString() || '0' }),
    ...(sortOrder !== undefined && { sortOrder }),
    updatedAt: new Date(),
  }).where(eq(plans.id, id));

  // Update features if provided
  if (featureIds !== undefined) {
    await db.delete(planFeatures).where(eq(planFeatures.planId, id));
    if (featureIds.length) {
      await db.insert(planFeatures).values(
        featureIds.map((fId: string) => ({ planId: id, featureId: fId }))
      );
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(plans).where(eq(plans.id, id));
  return NextResponse.json({ success: true });
}
