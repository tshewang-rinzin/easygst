import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getBankAccounts } from '@/lib/bank-accounts/queries';
import { db } from '@/lib/db/drizzle';
import { bankAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const accounts = await getBankAccounts();
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank accounts' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request, { user, team }) => {
  try {
    const data = await request.json();

    if (!data.bankName || !data.accountNumber || !data.accountName) {
      return NextResponse.json(
        { error: 'Bank name, account number, and account name are required' },
        { status: 400 }
      );
    }

    // If default, unset others
    if (data.isDefault) {
      await db
        .update(bankAccounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(bankAccounts.teamId, team.id));
    }

    const [account] = await db
      .insert(bankAccounts)
      .values({
        teamId: team.id,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        branch: data.branch || null,
        accountType: data.accountType || null,
        paymentMethod: data.paymentMethod || 'bank_transfer',
        qrCodeUrl: data.qrCodeUrl || null,
        isDefault: data.isDefault ?? false,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error creating bank account:', error);
    return NextResponse.json(
      { error: 'Failed to create bank account' },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (request, { user, team }) => {
  try {
    const { defaultAccountId } = await request.json();
    if (!defaultAccountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    // Unset all defaults for this team
    await db
      .update(bankAccounts)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(bankAccounts.teamId, team.id));

    // Set the new default
    await db
      .update(bankAccounts)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(bankAccounts.id, defaultAccountId), eq(bankAccounts.teamId, team.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting default bank account:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
});
