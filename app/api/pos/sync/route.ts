import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { processSale, SaleInput } from '@/app/api/pos/sale/route';
import { checkBodySize } from '@/lib/api/body-limit';

const syncSaleSchema = z.object({
  localId: z.string(),
  items: z.array(
    z.object({
      productId: z.string().uuid().nullish(),
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().min(0),
      discountPercent: z.number().min(0).max(100).default(0),
      taxRate: z.number().min(0).max(100).default(0),
      isTaxExempt: z.boolean().default(false),
      unit: z.string().default('piece'),
    })
  ).min(1),
  customerId: z.string().uuid().nullish(),
  paymentMethod: z.string().min(1).default('cash'),
  isCredit: z.boolean().default(false),
  paymentReference: z.string().nullish(),
  amountTendered: z.number().nullish(),
  transactionId: z.string().nullish(),
  notes: z.string().nullish(),
  createdAt: z.string().datetime().nullish(),
});

const syncSchema = z.object({
  sales: z.array(syncSaleSchema).min(1).max(100),
});

export const POST = withMobileAuth(async (request: NextRequest, context: MobileAuthContext) => {
  const sizeError = checkBodySize(request, 2 * 1024 * 1024); // 2MB for bulk sync
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const results = [];

    for (const sale of parsed.data.sales) {
      try {
        const { localId, paymentReference, ...saleData } = sale;
        if (paymentReference) (saleData as any).paymentReference = paymentReference;
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
          error: 'Failed to sync item',
        });
      }
    }

    const synced = results.filter(r => r.success).map(r => ({
      localId: r.localId,
      serverId: r.serverId!,
      invoiceNumber: r.invoiceNumber!,
    }));
    const errors = results.filter(r => !r.success).map(r => ({
      localId: r.localId,
      error: r.error || 'Unknown error',
    }));
    return NextResponse.json({ synced, errors });
  } catch (error) {
    console.error('[pos/sync] Error:', error);
    return NextResponse.json({ error: 'Failed to sync sales' }, { status: 500 });
  }
});
