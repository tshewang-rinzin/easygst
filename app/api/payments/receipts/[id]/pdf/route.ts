import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { getCustomerPaymentWithDetails } from '@/lib/customer-payments/queries';
import { getTeamForUser } from '@/lib/db/queries';
import { renderToBuffer } from '@react-pdf/renderer';
import { PaymentReceiptDocument } from '@/lib/pdf/templates/payment-receipt-template';

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payment = await getCustomerPaymentWithDetails(id);

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
}
