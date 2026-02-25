import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { bankIntegrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const bankIntegrationSchema = z.object({
  provider: z.string().min(1).max(50),
  accountNumber: z.string().max(50).optional(),
  accountName: z.string().max(255).optional(),
  merchantId: z.string().max(255).optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  config: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/settings/bank-integration — Get team's bank integration settings
export const GET = withAuth(async (_request: NextRequest, { team }) => {
  try {
    const integrations = await db
      .select()
      .from(bankIntegrations)
      .where(eq(bankIntegrations.teamId, team.id));

    // Mask sensitive fields
    const masked = integrations.map((i) => ({
      id: i.id,
      provider: i.provider,
      isActive: i.isActive,
      accountNumber: i.accountNumber,
      accountName: i.accountName,
      merchantId: i.merchantId,
      apiKey: i.apiKey ? '••••••' + i.apiKey.slice(-4) : null,
      apiSecret: i.apiSecret ? '••••••' + i.apiSecret.slice(-4) : null,
      config: i.config,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));

    return NextResponse.json(masked);
  } catch (error) {
    console.error('Error fetching bank integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// POST /api/settings/bank-integration — Save/update bank integration settings
export const POST = withAuth(async (request: NextRequest, { team }) => {
  try {
    const body = await request.json();
    const parsed = bankIntegrationSchema.parse(body);

    // Check if integration already exists for this team + provider
    const [existing] = await db
      .select()
      .from(bankIntegrations)
      .where(and(eq(bankIntegrations.teamId, team.id), eq(bankIntegrations.provider, parsed.provider)))
      .limit(1);

    if (existing) {
      // Update existing
      const updateData: Record<string, any> = {
        accountNumber: parsed.accountNumber ?? existing.accountNumber,
        accountName: parsed.accountName ?? existing.accountName,
        merchantId: parsed.merchantId ?? existing.merchantId,
        config: parsed.config ?? existing.config,
        isActive: parsed.isActive ?? existing.isActive,
        updatedAt: new Date(),
      };
      // Only update secrets if provided (don't overwrite with empty)
      if (parsed.apiKey) updateData.apiKey = parsed.apiKey;
      if (parsed.apiSecret) updateData.apiSecret = parsed.apiSecret;

      await db
        .update(bankIntegrations)
        .set(updateData)
        .where(eq(bankIntegrations.id, existing.id));

      return NextResponse.json({ message: 'Bank integration updated', id: existing.id });
    } else {
      // Create new
      const [created] = await db
        .insert(bankIntegrations)
        .values({
          teamId: team.id,
          provider: parsed.provider,
          accountNumber: parsed.accountNumber,
          accountName: parsed.accountName,
          merchantId: parsed.merchantId,
          apiKey: parsed.apiKey,
          apiSecret: parsed.apiSecret,
          config: parsed.config,
          isActive: parsed.isActive ?? false,
        })
        .returning({ id: bankIntegrations.id });

      return NextResponse.json({ message: 'Bank integration created', id: created.id }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    console.error('Error saving bank integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
