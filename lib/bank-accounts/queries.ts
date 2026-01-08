'use server';

import { db } from '@/lib/db/drizzle';
import { bankAccounts } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

/**
 * Get all bank accounts for the current user's team
 */
export async function getBankAccounts() {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const accounts = await db
    .select()
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.teamId, team.id),
        eq(bankAccounts.isActive, true)
      )
    )
    .orderBy(desc(bankAccounts.isDefault), bankAccounts.sortOrder, bankAccounts.id);

  return accounts;
}

/**
 * Get a single bank account by ID
 */
export async function getBankAccountById(accountId: number) {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const [account] = await db
    .select()
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.id, accountId),
        eq(bankAccounts.teamId, team.id)
      )
    )
    .limit(1);

  return account || null;
}

/**
 * Get the default bank account for the team
 */
export async function getDefaultBankAccount() {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }

  const [account] = await db
    .select()
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.teamId, team.id),
        eq(bankAccounts.isDefault, true),
        eq(bankAccounts.isActive, true)
      )
    )
    .limit(1);

  return account || null;
}

/**
 * Get active bank accounts (for dropdown selections)
 */
export async function getActiveBankAccounts() {
  const team = await getTeamForUser();
  if (!team) {
    return [];
  }

  const accounts = await db
    .select({
      id: bankAccounts.id,
      bankName: bankAccounts.bankName,
      accountNumber: bankAccounts.accountNumber,
      accountName: bankAccounts.accountName,
      paymentMethod: bankAccounts.paymentMethod,
      isDefault: bankAccounts.isDefault,
    })
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.teamId, team.id),
        eq(bankAccounts.isActive, true)
      )
    )
    .orderBy(desc(bankAccounts.isDefault), bankAccounts.sortOrder);

  return accounts;
}
