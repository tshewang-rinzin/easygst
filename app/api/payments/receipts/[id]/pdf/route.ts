import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getCustomerPaymentWithDetails } from '@/lib/customer-payments/queries';
import { renderToBuffer } from '@react-pdf/renderer';
import { PaymentReceiptDocument } from '@/lib/pdf/templates/payment-receipt-template';

export const GET = withAuth(async (request: NextRequest, { team, params }) => {
  try {
    const payment = await getCustomerPaymentWithDetails(params.id);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(PaymentReceiptDocument, { payment, team } as any) as any
    );

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${payment.receiptNumber || 'receipt'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
});
