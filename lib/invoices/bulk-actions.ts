'use server';

import { z } from 'zod';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import { invoices, activityLogs, ActivityType } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const bulkStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Select at least one invoice'),
  status: z.enum(['sent', 'paid', 'cancelled']),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Select at least one invoice'),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  sent: ['draft'],
  paid: ['sent', 'viewed'],
  cancelled: ['draft', 'sent', 'viewed', 'overdue', 'partial'],
};

export const bulkUpdateInvoiceStatus = validatedActionWithUser(
  bulkStatusSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      // Fetch all invoices and verify ownership
      const targetInvoices = await db
        .select()
        .from(invoices)
        .where(
          and(
            inArray(invoices.id, data.ids),
            eq(invoices.teamId, team.id)
          )
        );

      if (targetInvoices.length !== data.ids.length) {
        return { error: 'Some invoices were not found or do not belong to your team' };
      }

      // Validate transitions
      const allowedFrom = VALID_TRANSITIONS[data.status];
      const invalid = targetInvoices.filter(
        (inv) => !allowedFrom.includes(inv.status)
      );
      if (invalid.length > 0) {
        const nums = invalid.map((i) => i.invoiceNumber).join(', ');
        return {
          error: `Cannot change status to "${data.status}" for: ${nums}. Invalid current status.`,
        };
      }

      // Build update set
      const updateSet: Record<string, any> = {
        status: data.status,
        updatedAt: new Date(),
      };

      if (data.status === 'paid') {
        updateSet.paymentStatus = 'paid';
        updateSet.amountDue = '0';
      }

      await db
        .update(invoices)
        .set(updateSet)
        .where(
          and(
            inArray(invoices.id, data.ids),
            eq(invoices.teamId, team.id)
          )
        );

      // Log activity
      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.EDIT_INVOICE,
        ipAddress: '',
      });

      revalidatePath('/invoices');
      return { success: `${targetInvoices.length} invoice(s) updated to "${data.status}"` };
    } catch (error) {
      console.error('Bulk status update error:', error);
      return { error: 'Failed to update invoices' };
    }
  }
);

export const bulkDeleteInvoices = validatedActionWithUser(
  bulkDeleteSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const targetInvoices = await db
        .select()
        .from(invoices)
        .where(
          and(
            inArray(invoices.id, data.ids),
            eq(invoices.teamId, team.id)
          )
        );

      if (targetInvoices.length !== data.ids.length) {
        return { error: 'Some invoices were not found or do not belong to your team' };
      }

      const nonDraft = targetInvoices.filter((inv) => inv.status !== 'draft');
      if (nonDraft.length > 0) {
        return { error: 'Only draft invoices can be deleted' };
      }

      await db
        .delete(invoices)
        .where(
          and(
            inArray(invoices.id, data.ids),
            eq(invoices.teamId, team.id)
          )
        );

      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: ActivityType.DELETE_INVOICE,
        ipAddress: '',
      });

      revalidatePath('/invoices');
      return { success: `${targetInvoices.length} invoice(s) deleted` };
    } catch (error) {
      console.error('Bulk delete error:', error);
      return { error: 'Failed to delete invoices' };
    }
  }
);
