import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getTourInvoicesForExport } from '@/lib/db/tour-invoice-queries';

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const dateFrom = url.searchParams.get('dateFrom') ? new Date(url.searchParams.get('dateFrom')!) : undefined;
    const dateTo = url.searchParams.get('dateTo') ? new Date(url.searchParams.get('dateTo')!) : undefined;

    const results = await getTourInvoicesForExport({ status, dateFrom, dateTo });

    const headers = [
      'Invoice #', 'Date', 'Customer', 'Tour Name', 'Tour Type',
      'Arrival', 'Departure', 'Nights', 'Guests', 'Nationality',
      'Subtotal', 'SDF', 'Tax', 'Grand Total', 'Status', 'Payment Status',
    ];

    const formatDate = (d: Date | null) => d ? new Date(d).toISOString().split('T')[0] : '';

    const rows = results.map(({ tourInvoice: inv, customer }) => [
      inv.invoiceNumber,
      formatDate(inv.invoiceDate),
      customer?.name || '',
      inv.tourName,
      inv.tourType,
      formatDate(inv.arrivalDate),
      formatDate(inv.departureDate),
      String(inv.numberOfNights ?? ''),
      String(inv.numberOfGuests),
      inv.guestNationality,
      inv.subtotal,
      inv.sdfTotal,
      inv.totalTax,
      inv.grandTotal,
      inv.status,
      inv.paymentStatus,
    ]);

    const csv = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    const filename = `tour-invoices-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting tour invoices:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
});
