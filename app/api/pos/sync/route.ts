import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { processSale, SaleInput } from '@/app/api/pos/sale/route';

const syncSaleSchema = z.object({
  localId: z.string(),
  items: z.array(
    z.object({
      productId: z.string().uuid().optional(),
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().min(0),
      discountPercent: z.number().min(0).max(100).default(0),
      taxRate: z.number().min(0).max(100).default(0),
      isTaxExempt: z.boolean().default(false),
      unit: z.string().default('piece'),
    })
  ).min(1),
  customerId: z.string().uuid().optional(),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'qr']).default('cash'),
  isCredit: z.boolean().default(false),
  amountTendered: z.number().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});

const syncSchema = z.object({
  sales: z.array(syncSaleSchema).min(1).max(100),
});

export const POST = withMobileAuth(async (request: NextRequest, context: MobileAuthContext) => {
  try {
    const body = await request.json();
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const results = [];

    for (const sale of parsed.data.sales) {
      try {
        const { localId, ...saleData } = sale;
        const result = await processSale(saleData as SaleInput, context);
        results.push({
          localId,
          serverId: result.receipt.id,
          invoiceNumber: result.receipt.invoiceNumber,
          success: true,
        });
      } catch (error) {
        results.push({
          localId: sale.localId,
          serverId: null,
          invoiceNumber: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[pos/sync] Error:', error);
    return NextResponse.json({ error: 'Failed to sync sales' }, { status: 500 });
  }
});
