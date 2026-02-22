import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { createInvoiceFromContract } from '@/lib/contracts/actions';

export const POST = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    const body = await request.json();

    const result = await createInvoiceFromContract(
      {
        contractId: params.id,
        milestoneId: body.milestoneId,
        billingScheduleId: body.billingScheduleId,
        percentage: body.percentage,
        amount: body.amount,
        description: body.description,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        currency: body.currency,
        taxRate: body.taxRate,
        isTaxExempt: body.isTaxExempt,
        paymentTerms: body.paymentTerms,
        customerNotes: body.customerNotes,
        notes: body.notes,
      },
      user.id
    );

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating invoice from contract:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
});
