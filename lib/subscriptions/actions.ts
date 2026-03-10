'use server';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';
import {
  customerSubscriptions,
  customerSubscriptionInvoices,
  invoices,
  invoiceItems,
  products,
  customers,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { generateSubscriptionNumber } from './numbering';
import { generateInvoiceNumber } from '@/lib/invoices/numbering';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
  customerId: z.string().uuid(),
  productId: z.string().uuid(),
  billingCycle: z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly']),
  price: z.coerce.number().min(0),
  startDate: z.string().min(1),
  autoInvoice: z.preprocess(
    (val) => val === 'true' || val === true || val === 'on',
    z.boolean().default(true)
  ),
  notes: z.string().optional(),
});

const updateSubscriptionSchema = z.object({
  id: z.string().uuid(),
  billingCycle: z.enum(['monthly', 'quarterly', 'half_yearly', 'yearly']).optional(),
  price: z.coerce.number().min(0).optional(),
  autoInvoice: z.preprocess(
    (val) => val === 'true' || val === true || val === 'on',
    z.boolean().default(true)
  ),
  notes: z.string().optional(),
  expiryDate: z.string().optional(),
});

function addBillingCycleDuration(date: Date, cycle: string): Date {
  const result = new Date(date);
  switch (cycle) {
    case 'monthly':
      result.setMonth(result.getMonth() + 1);
      break;
    case 'quarterly':
      result.setMonth(result.getMonth() + 3);
      break;
    case 'half_yearly':
      result.setMonth(result.getMonth() + 6);
      break;
    case 'yearly':
      result.setFullYear(result.getFullYear() + 1);
      break;
  }
  return result;
}

function getBillingCycleLabel(cycle: string): string {
  const labels: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    half_yearly: 'Half Yearly',
    yearly: 'Yearly',
  };
  return labels[cycle] || cycle;
}

function formatPeriod(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}`;
}

/**
 * Create a new subscription
 */
export const createSubscription = validatedActionWithUser(
  createSubscriptionSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const subscriptionNumber = await generateSubscriptionNumber(team.id);
      const startDate = new Date(data.startDate);
      const nextBillingDate = addBillingCycleDuration(startDate, data.billingCycle);

      const [subscription] = await db
        .insert(customerSubscriptions)
        .values({
          teamId: team.id,
          customerId: data.customerId,
          productId: data.productId,
          subscriptionNumber,
          status: 'active',
          billingCycle: data.billingCycle,
          price: data.price.toString(),
          currency: team.defaultCurrency || 'BTN',
          startDate,
          nextBillingDate,
          autoInvoice: data.autoInvoice,
          notes: data.notes || null,
          createdBy: user.id,
        })
        .returning();

      await db.insert(activityLogs).values({
        teamId: team.id,
        userId: user.id,
        action: `Created subscription ${subscriptionNumber}`,
        timestamp: new Date(),
      });

      revalidatePath('/subscriptions');
      return { success: 'Subscription created successfully', subscriptionId: subscription.id };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { error: 'Failed to create subscription' };
    }
  }
);

/**
 * Update subscription
 */
export const updateSubscription = validatedActionWithUser(
  updateSubscriptionSchema,
  async (data, _, user) => {
    try {
      const team = await getTeamForUser();
      if (!team) return { error: 'Team not found' };

      const updateValues: any = { updatedAt: new Date() };
      if (data.billingCycle) updateValues.billingCycle = data.billingCycle;
      if (data.price !== undefined) updateValues.price = data.price.toString();
      if (data.autoInvoice !== undefined) updateValues.autoInvoice = data.autoInvoice;
      if (data.notes !== undefined) updateValues.notes = data.notes || null;
      if (data.expiryDate) updateValues.expiryDate = new Date(data.expiryDate);

      await db
        .update(customerSubscriptions)
        .set(updateValues)
        .where(
          and(
            eq(customerSubscriptions.id, data.id),
            eq(customerSubscriptions.teamId, team.id)
          )
        );

      revalidatePath('/subscriptions');
      revalidatePath(`/subscriptions/${data.id}`);
      return { success: 'Subscription updated successfully' };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { error: 'Failed to update subscription' };
    }
  }
);

/**
 * Pause subscription
 */
export async function pauseSubscription(subscriptionId: string) {
  const team = await getTeamForUser();
  if (!team) return { error: 'Team not found' };

  await db
    .update(customerSubscriptions)
    .set({ status: 'paused', updatedAt: new Date() })
    .where(
      and(
        eq(customerSubscriptions.id, subscriptionId),
        eq(customerSubscriptions.teamId, team.id)
      )
    );

  revalidatePath('/subscriptions');
  revalidatePath(`/subscriptions/${subscriptionId}`);
  return { success: 'Subscription paused' };
}

/**
 * Resume subscription
 */
export async function resumeSubscription(subscriptionId: string) {
  const team = await getTeamForUser();
  if (!team) return { error: 'Team not found' };

  await db
    .update(customerSubscriptions)
    .set({ status: 'active', updatedAt: new Date() })
    .where(
      and(
        eq(customerSubscriptions.id, subscriptionId),
        eq(customerSubscriptions.teamId, team.id)
      )
    );

  revalidatePath('/subscriptions');
  revalidatePath(`/subscriptions/${subscriptionId}`);
  return { success: 'Subscription resumed' };
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  const team = await getTeamForUser();
  if (!team) return { error: 'Team not found' };

  await db
    .update(customerSubscriptions)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(
        eq(customerSubscriptions.id, subscriptionId),
        eq(customerSubscriptions.teamId, team.id)
      )
    );

  revalidatePath('/subscriptions');
  revalidatePath(`/subscriptions/${subscriptionId}`);
  return { success: 'Subscription cancelled' };
}

/**
 * Generate an invoice from a subscription
 */
export async function generateSubscriptionInvoice(subscriptionId: string) {
  const team = await getTeamForUser();
  if (!team) return { error: 'Team not found' };

  const { getUser } = await import('@/lib/db/queries');
  const user = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const [sub] = await db
    .select()
    .from(customerSubscriptions)
    .where(
      and(
        eq(customerSubscriptions.id, subscriptionId),
        eq(customerSubscriptions.teamId, team.id)
      )
    )
    .limit(1);

  if (!sub) return { error: 'Subscription not found' };

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, sub.productId))
    .limit(1);

  if (!product) return { error: 'Product not found' };

  const billingPeriodStart = new Date(sub.nextBillingDate);
  const billingPeriodEnd = addBillingCycleDuration(billingPeriodStart, sub.billingCycle);

  const invoiceNumber = await generateInvoiceNumber(team.id, team.invoicePrefix || 'INV');
  const price = parseFloat(sub.price);
  const taxRate = parseFloat(product.defaultTaxRate);
  const isTaxExempt = product.isTaxExempt;
  const taxAmount = isTaxExempt ? 0 : price * (taxRate / 100);
  const totalAmount = price + taxAmount;

  const periodStr = formatPeriod(billingPeriodStart, billingPeriodEnd);
  const description = `${product.name} (${periodStr})`;

  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 15);

  const result = await db.transaction(async (tx) => {
    // Create invoice
    const [invoice] = await tx
      .insert(invoices)
      .values({
        teamId: team.id,
        customerId: sub.customerId,
        invoiceNumber,
        invoiceDate: today,
        dueDate,
        currency: sub.currency,
        subtotal: price.toFixed(2),
        totalTax: taxAmount.toFixed(2),
        totalDiscount: '0',
        totalAmount: totalAmount.toFixed(2),
        amountPaid: '0',
        amountDue: totalAmount.toFixed(2),
        status: 'sent',
        paymentStatus: 'unpaid',
        createdBy: user.id,
      })
      .returning();

    // Create line item
    await tx.insert(invoiceItems).values({
      invoiceId: invoice.id,
      productId: product.id,
      description,
      quantity: '1',
      unit: product.unit || 'service',
      unitPrice: price.toFixed(2),
      lineTotal: price.toFixed(2),
      discountPercent: '0',
      discountAmount: '0',
      taxRate: taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      isTaxExempt,
      gstClassification: product.gstClassification,
      itemTotal: totalAmount.toFixed(2),
      sortOrder: 0,
    });

    // Link in subscription_invoices
    await tx.insert(customerSubscriptionInvoices).values({
      subscriptionId: sub.id,
      invoiceId: invoice.id,
      billingPeriodStart,
      billingPeriodEnd,
    });

    // Advance nextBillingDate
    const newNextBillingDate = billingPeriodEnd;
    const updateValues: any = {
      nextBillingDate: newNextBillingDate,
      updatedAt: new Date(),
    };

    // Check expiry
    if (sub.expiryDate && newNextBillingDate > sub.expiryDate) {
      updateValues.status = 'expired';
    }

    await tx
      .update(customerSubscriptions)
      .set(updateValues)
      .where(eq(customerSubscriptions.id, sub.id));

    return invoice;
  });

  revalidatePath('/subscriptions');
  revalidatePath(`/subscriptions/${subscriptionId}`);
  revalidatePath('/sales/invoices');
  return { success: 'Invoice generated successfully', invoiceId: result.id };
}

/**
 * Batch generate invoices for all due subscriptions
 */
export async function generateDueInvoices() {
  const team = await getTeamForUser();
  if (!team) return { error: 'Team not found' };

  const now = new Date();

  const dueSubscriptions = await db
    .select()
    .from(customerSubscriptions)
    .where(
      and(
        eq(customerSubscriptions.teamId, team.id),
        eq(customerSubscriptions.status, 'active'),
        eq(customerSubscriptions.autoInvoice, true),
        lte(customerSubscriptions.nextBillingDate, now)
      )
    );

  let generated = 0;
  const errors: string[] = [];

  for (const sub of dueSubscriptions) {
    const result = await generateSubscriptionInvoice(sub.id);
    if ('error' in result && result.error) {
      errors.push(`${sub.subscriptionNumber}: ${result.error}`);
    } else {
      generated++;
    }
  }

  revalidatePath('/subscriptions');
  return {
    success: `Generated ${generated} invoice(s)`,
    generated,
    errors: errors.length > 0 ? errors : undefined,
  };
}
