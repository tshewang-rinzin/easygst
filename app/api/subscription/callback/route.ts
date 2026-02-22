import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { subscriptionPayments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getPaymentGateway } from '@/lib/payments';
import { activateSubscription, completePayment } from '@/lib/subscriptions';

/**
 * Payment gateway callback — NO session auth.
 * Uses payment_id and subscription_id from query params.
 * RMA gateway redirects user here after payment.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const paymentId = searchParams.get('payment_id');
  const subscriptionId = searchParams.get('subscription_id');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  if (!paymentId || !subscriptionId) {
    return NextResponse.redirect(`${baseUrl}/settings/subscription?error=invalid_callback`);
  }

  try {
    // Get payment record
    const [payment] = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.id, paymentId))
      .limit(1);

    if (!payment) {
      return NextResponse.redirect(`${baseUrl}/settings/subscription?error=payment_not_found`);
    }

    if (payment.status === 'completed') {
      // Already processed — just redirect
      return NextResponse.redirect(`${baseUrl}/settings/subscription?success=true`);
    }

    // Verify payment with gateway
    const gateway = getPaymentGateway();
    const gatewayParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      gatewayParams[key] = value;
    });

    const verification = await gateway.verify({
      transactionId: payment.transactionId || '',
      gatewayParams,
    });

    if (verification.success && verification.paid) {
      // Mark payment as completed
      await completePayment(
        paymentId,
        verification.transactionId || payment.transactionId || '',
        verification.rawResponse
      );

      // Activate subscription + update team plan
      await activateSubscription(subscriptionId);

      return NextResponse.redirect(`${baseUrl}/settings/subscription?success=true`);
    } else {
      // Payment failed or not verified
      await db
        .update(subscriptionPayments)
        .set({ status: 'failed', gatewayResponse: verification.rawResponse })
        .where(eq(subscriptionPayments.id, paymentId));

      return NextResponse.redirect(`${baseUrl}/settings/subscription?error=payment_failed`);
    }
  } catch (error) {
    console.error('[Subscription Callback] Error:', error);
    return NextResponse.redirect(`${baseUrl}/settings/subscription?error=processing_error`);
  }
}
