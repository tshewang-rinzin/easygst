import { NextResponse } from 'next/server';
import { getUnpaidInvoices, getUnpaidInvoicesSummary } from '@/lib/reports/unpaid-invoices';

export async function GET() {
  try {
    const [invoices, summary] = await Promise.all([
      getUnpaidInvoices(),
      getUnpaidInvoicesSummary(),
    ]);

    return NextResponse.json({ invoices, summary });
  } catch (error) {
    console.error('Error fetching unpaid invoices report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unpaid invoices report' },
      { status: 500 }
    );
  }
}
