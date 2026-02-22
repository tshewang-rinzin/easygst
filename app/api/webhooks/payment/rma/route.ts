import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { subscriptionPayments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { activateSubscription, completePayment } from '@/lib/subscriptions';

/**
 * RMA Payment Gateway Webhook — NO auth (webhook from RMA).
 * TODO: Add signature verification when real RMA integration is available.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction_id, status, amount } = body;

    // TODO: Verify webhook signature
    // const signature = request.headers.get('x-rma-signature');
    // if (!verifySignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    if (!transaction_id) {
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
    }

    // Find payment by transaction ID
    const [payment] = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.transactionId, transaction_id))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'completed') {
      return NextResponse.json({ message: 'Already processed' });
    }

    if (status === 'success' || status === 'paid') {
      await completePayment(payment.id, transaction_id, body);
      await activateSubscription(payment.subscriptionId);

      return NextResponse.json({ message: 'Payment confirmed, subscription activated' });
    } else {
      await db
        .update(subscriptionPayments)
        .set({ status: 'failed', gatewayResponse: body })
        .where(eq(subscriptionPayments.id, payment.id));

      return NextResponse.json({ message: 'Payment status updated' });
    }
  } catch (error) {
    console.error('[RMA Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
