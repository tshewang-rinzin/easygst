import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { generateDueInvoices } from '@/lib/subscriptions/actions';

export const POST = withAuth(async () => {
  try {
    const result = await generateDueInvoices();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating due invoices:', error);
    return NextResponse.json({ error: 'Failed to generate invoices' }, { status: 500 });
  }
});
