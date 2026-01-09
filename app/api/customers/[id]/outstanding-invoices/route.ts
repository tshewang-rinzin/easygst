import { NextRequest, NextResponse } from 'next/server';
import { getCustomerOutstandingInvoices } from '@/lib/customer-payments/queries';

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const invoices = await getCustomerOutstandingInvoices(customerId);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching customer outstanding invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outstanding invoices' },
      { status: 500 }
    );
  }
}
