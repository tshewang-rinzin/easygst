'use server';

import { db } from '@/lib/db/drizzle';
import { gstReturns, gstPeriodLocks } from '@/lib/db/schema';
import { getTeamForUser, getUserWithTeam } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import {
  createGstReturnSchema,
  fileGstReturnSchema,
  createPeriodLockSchema,
  amendGstReturnSchema,
} from './validation';
import { calculateGstForPeriod, generateReturnNumber, isPeriodLocked } from './queries';
import { validatedAction, validatedActionWithUser, validatedActionWithRole } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';
import Decimal from 'decimal.js';

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Create a new GST return (draft)
 */
export const createGstReturn = validatedActionWithUser(
  createGstReturnSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Check if period is already locked
      const locked = await isPeriodLocked(data.periodStart, data.periodEnd);
      if (locked) {
        return { error: 'This period is already locked' };
      }

      // Calculate GST for the period
      const gstData = await calculateGstForPeriod(data.periodStart, data.periodEnd);

      // Generate return number
      const returnNumber = generateReturnNumber(data.periodStart, data.returnType);

      // Calculate due date (typically 20th of next month)
      const dueDate = new Date(data.periodEnd);
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(20);

      // Calculate total payable
      const totalPayable = new Decimal(gstData.netGstPayable);

      // Insert GST return
      const [newReturn] = await db
        .insert(gstReturns)
        .values({
          teamId: team.id,
          returnNumber,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          returnType: data.returnType,
          status: 'draft',
          outputGst: gstData.outputGst,
          inputGst: gstData.inputGst,
          netGstPayable: gstData.netGstPayable,
          adjustments: '0.00',
          previousPeriodBalance: '0.00',
          penalties: '0.00',
          interest: '0.00',
          totalPayable: totalPayable.toFixed(2),
          dueDate,
          salesBreakdown: gstData.salesBreakdown,
          purchasesBreakdown: gstData.purchasesBreakdown,
          notes: data.notes || null,
          createdBy: user.id,
        })
        .returning();

      revalidatePath('/gst');
      return { success: true, returnId: newReturn.id };
    } catch (error) {
      console.error('Error creating GST return:', error);
      return { error: 'Failed to create GST return' };
    }
  }
);

/**
 * File a GST return (mark as submitted)
 */
export const fileGstReturn = validatedActionWithRole(
  fileGstReturnSchema,
  'owner',
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Get the return
      const [existingReturn] = await db
        .select()
        .from(gstReturns)
        .where(and(eq(gstReturns.id, data.returnId), eq(gstReturns.teamId, team.id)))
        .limit(1);

      if (!existingReturn) {
        return { error: 'GST return not found' };
      }

      if (existingReturn.status !== 'draft') {
        return { error: 'Only draft returns can be filed' };
      }

      // Calculate total payable with adjustments
      const netGst = new Decimal(existingReturn.netGstPayable);
      const adjustments = new Decimal(data.adjustments);
      const previousBalance = new Decimal(data.previousPeriodBalance);
      const penalties = new Decimal(data.penalties);
      const interest = new Decimal(data.interest);

      const totalPayable = netGst
        .plus(adjustments)
        .plus(previousBalance)
        .plus(penalties)
        .plus(interest);

      // Update return
      await db
        .update(gstReturns)
        .set({
          status: 'filed',
          filingDate: data.filingDate,
          filedBy: user.id,
          adjustments: data.adjustments.toFixed(2),
          previousPeriodBalance: data.previousPeriodBalance.toFixed(2),
          penalties: data.penalties.toFixed(2),
          interest: data.interest.toFixed(2),
          totalPayable: totalPayable.toFixed(2),
          notes: data.notes || existingReturn.notes,
          updatedAt: new Date(),
        })
        .where(eq(gstReturns.id, data.returnId));

      // Auto-lock the period
      await db.insert(gstPeriodLocks).values({
        teamId: team.id,
        periodStart: existingReturn.periodStart,
        periodEnd: existingReturn.periodEnd,
        periodType: existingReturn.returnType as 'monthly' | 'quarterly' | 'annual',
        lockedBy: user.id,
        reason: 'Automatically locked upon filing GST return',
        gstReturnId: data.returnId,
      });

      revalidatePath('/gst');
      return { success: true };
    } catch (error) {
      console.error('Error filing GST return:', error);
      return { error: 'Failed to file GST return' };
    }
  }
);

/**
 * Amend a filed GST return
 */
export const amendGstReturn = validatedActionWithUser(
  amendGstReturnSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Get the return
      const [existingReturn] = await db
        .select()
        .from(gstReturns)
        .where(and(eq(gstReturns.id, data.returnId), eq(gstReturns.teamId, team.id)))
        .limit(1);

      if (!existingReturn) {
        return { error: 'GST return not found' };
      }

      if (existingReturn.status !== 'filed') {
        return { error: 'Only filed returns can be amended' };
      }

      // Track amendment history
      const amendments = existingReturn.amendments as any[] || [];
      amendments.push({
        date: new Date().toISOString(),
        userId: user.id,
        reason: data.reason,
        previousAdjustments: existingReturn.adjustments,
        newAdjustments: data.adjustments.toFixed(2),
      });

      // Recalculate total payable
      const netGst = new Decimal(existingReturn.netGstPayable);
      const adjustments = new Decimal(data.adjustments);
      const previousBalance = new Decimal(existingReturn.previousPeriodBalance || 0);
      const penalties = new Decimal(existingReturn.penalties || 0);
      const interest = new Decimal(existingReturn.interest || 0);

      const totalPayable = netGst
        .plus(adjustments)
        .plus(previousBalance)
        .plus(penalties)
        .plus(interest);

      // Update return
      await db
        .update(gstReturns)
        .set({
          status: 'amended',
          adjustments: data.adjustments.toFixed(2),
          totalPayable: totalPayable.toFixed(2),
          amendments,
          updatedAt: new Date(),
        })
        .where(eq(gstReturns.id, data.returnId));

      revalidatePath('/gst');
      return { success: true };
    } catch (error) {
      console.error('Error amending GST return:', error);
      return { error: 'Failed to amend GST return' };
    }
  }
);

/**
 * Delete a draft GST return
 */
export async function deleteGstReturn(returnId: string) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return { error: 'Team not found' };
    }

    // Get the return
    const [existingReturn] = await db
      .select()
      .from(gstReturns)
      .where(and(eq(gstReturns.id, returnId), eq(gstReturns.teamId, team.id)))
      .limit(1);

    if (!existingReturn) {
      return { error: 'GST return not found' };
    }

    if (existingReturn.status !== 'draft') {
      return { error: 'Only draft returns can be deleted' };
    }

    // Delete the return
    await db.delete(gstReturns).where(eq(gstReturns.id, returnId));

    revalidatePath('/gst');
    return { success: true };
  } catch (error) {
    console.error('Error deleting GST return:', error);
    return { error: 'Failed to delete GST return' };
  }
}

/**
 * Create a period lock
 */
export const createPeriodLock = validatedActionWithRole(
  createPeriodLockSchema,
  'owner',
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) {
        return { error: 'Team not found' };
      }

      // Check if period is already locked
      const locked = await isPeriodLocked(data.periodStart, data.periodEnd);
      if (locked) {
        return { error: 'This period is already locked' };
      }

      // Create lock
      await db.insert(gstPeriodLocks).values({
        teamId: team.id,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        periodType: data.periodType,
        lockedBy: user.id,
        reason: data.reason || 'Manual period lock',
        gstReturnId: data.gstReturnId || null,
      });

      revalidatePath('/gst');
      return { success: true };
    } catch (error) {
      console.error('Error creating period lock:', error);
      return { error: 'Failed to create period lock' };
    }
  }
);

/**
 * Remove a period lock
 */
export async function removePeriodLock(lockId: string) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return { error: 'Team not found' };
    }

    // Delete the lock
    await db
      .delete(gstPeriodLocks)
      .where(and(eq(gstPeriodLocks.id, lockId), eq(gstPeriodLocks.teamId, team.id)));

    revalidatePath('/gst');
    return { success: true };
  } catch (error) {
    console.error('Error removing period lock:', error);
    return { error: 'Failed to remove period lock' };
  }
}
