import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getCustomerOutstandingInvoices } from '@/lib/customer-payments/queries';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;

    const invoices = await getCustomerOutstandingInvoices(id);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching customer outstanding invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outstanding invoices' },
      { status: 500 }
    );
  }
});
