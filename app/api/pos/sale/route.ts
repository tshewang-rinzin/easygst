import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import {
  invoices,
  invoiceItems,
  payments,
  customers,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateInvoiceNumber } from '@/lib/invoices/numbering';
import { calculateLineItem, calculateInvoiceTotals } from '@/lib/invoices/calculations';
import { getGSTClassification } from '@/lib/invoices/gst-classification';
import Decimal from 'decimal.js';

const saleItemSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  isTaxExempt: z.boolean().default(false),
  unit: z.string().default('piece'),
});

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  customerId: z.string().uuid().optional(),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'qr']).default('cash'),
  isCredit: z.boolean().default(false),
  amountTendered: z.number().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});

export type SaleInput = z.infer<typeof saleSchema>;

/**
 * Core sale processing logic — shared between single sale and sync
 */
export async function processSale(
  data: SaleInput,
  context: MobileAuthContext
) {
  const teamId = context.team.id;
  const userId = context.user.id;
  const currency = context.team.defaultCurrency;

  // Resolve customer
  let customerId = data.customerId;
  if (!customerId) {
    // Find or create walk-in customer
    const [walkIn] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.teamId, teamId), eq(customers.isWalkIn, true)))
      .limit(1);

    if (walkIn) {
      customerId = walkIn.id;
    } else {
      const [newWalkIn] = await db
        .insert(customers)
        .values({
          teamId,
          name: 'Walk-in Customer',
          customerType: 'individual',
          isWalkIn: true,
          createdBy: userId,
        })
        .returning();
      customerId = newWalkIn.id;
    }
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(teamId, context.team.invoicePrefix || 'INV');

  // Calculate line items
  const calculatedItems = data.items.map((item, index) => {
    const calculated = calculateLineItem({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent || 0,
      taxRate: item.taxRate,
      isTaxExempt: item.isTaxExempt ?? false,
    });

    const gstClassification = getGSTClassification(item.taxRate, item.isTaxExempt ?? false);

    return {
      productId: item.productId || null,
      description: item.description,
      quantity: item.quantity.toString(),
      unit: item.unit || 'piece',
      unitPrice: item.unitPrice.toString(),
      lineTotal: calculated.subtotal,
      discountPercent: (item.discountPercent || 0).toString(),
      discountAmount: calculated.discountAmount,
      taxRate: item.taxRate.toString(),
      taxAmount: calculated.taxAmount,
      isTaxExempt: item.isTaxExempt ?? false,
      gstClassification,
      itemTotal: calculated.itemTotal,
      sortOrder: index,
    };
  });

  // Calculate totals
  const totals = calculateInvoiceTotals(
    data.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent || 0,
      taxRate: item.taxRate,
      isTaxExempt: item.isTaxExempt ?? false,
    }))
  );

  const isPaid = !data.isCredit;
  const invoiceDate = data.createdAt ? new Date(data.createdAt) : new Date();

  // Create invoice (+ payment if not credit) in transaction
  const [invoice] = await db.transaction(async (tx) => {
    const [newInvoice] = await tx
      .insert(invoices)
      .values({
        teamId,
        customerId: customerId!,
        invoiceNumber,
        invoiceDate,
        dueDate: isPaid ? null : new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        currency,
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        totalTax: totals.totalTax,
        totalAmount: totals.totalAmount,
        amountPaid: isPaid ? totals.totalAmount : '0.00',
        amountDue: isPaid ? '0.00' : totals.totalAmount,
        status: isPaid ? 'paid' : 'sent',
        paymentStatus: isPaid ? 'paid' : 'unpaid',
        isLocked: isPaid,
        lockedAt: isPaid ? new Date() : null,
        lockedBy: isPaid ? userId : null,
        paymentTerms: isPaid ? 'POS Cash Sale' : 'POS Credit Sale - Net 30',
        notes: data.notes || null,
        createdBy: userId,
      })
      .returning();

    await tx.insert(invoiceItems).values(
      calculatedItems.map((item) => ({
        ...item,
        invoiceId: newInvoice.id,
      }))
    );

    if (isPaid) {
      await tx.insert(payments).values({
        teamId,
        invoiceId: newInvoice.id,
        amount: totals.totalAmount,
        currency,
        paymentDate: invoiceDate,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId || null,
        receiptNumber: invoiceNumber,
        notes: 'POS Sale',
        createdBy: userId,
      });
    }

    return [newInvoice];
  });

  // Get customer name
  const [customer] = await db
    .select({ name: customers.name })
    .from(customers)
    .where(eq(customers.id, customerId!))
    .limit(1);

  // Calculate change
  let change: number | undefined;
  if (isPaid && data.paymentMethod === 'cash' && data.amountTendered) {
    const totalDec = new Decimal(totals.totalAmount);
    const tendered = new Decimal(data.amountTendered);
    if (tendered.greaterThan(totalDec)) {
      change = tendered.minus(totalDec).toNumber();
    }
  }

  return {
    receipt: {
      id: invoice.id,
      invoiceNumber,
      date: invoice.invoiceDate,
      items: calculatedItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        discountPercent: item.discountPercent,
        itemTotal: item.itemTotal,
      })),
      subtotal: totals.subtotal,
      taxAmount: totals.totalTax,
      totalDiscount: totals.totalDiscount,
      totalAmount: totals.totalAmount,
      paymentMethod: data.paymentMethod,
      isCredit: data.isCredit,
      customerName: customer?.name || 'Walk-in Customer',
      ...(change !== undefined && { change }),
    },
  };
}

export const POST = withMobileAuth(async (request: NextRequest, context: MobileAuthContext) => {
  try {
    const body = await request.json();
    const parsed = saleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await processSale(parsed.data, context);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[pos/sale] Error:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
});
