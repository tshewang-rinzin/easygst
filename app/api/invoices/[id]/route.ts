import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getInvoiceWithDetails } from '@/lib/invoices/queries';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;

    const invoice = await getInvoiceWithDetails(id);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
