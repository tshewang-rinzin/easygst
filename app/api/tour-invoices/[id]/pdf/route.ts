import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getTourInvoice } from '@/lib/db/tour-invoice-queries';
import { getActiveBankAccounts } from '@/lib/bank-accounts/queries';
import { generateTourInvoicePDF, getTourInvoicePDFFilename } from '@/lib/pdf/generator';
import { calcSDFMixed } from '@/lib/tour-invoice/sdf';
import QRCode from 'qrcode';

export const GET = withAuth(async (request: NextRequest, { team, params }) => {
  try {
    const [invoice, bankAccounts] = await Promise.all([
      getTourInvoice(params.id),
      getActiveBankAccounts().catch(() => []),
    ]);

    if (!invoice) {
      return NextResponse.json({ error: 'Tour invoice not found' }, { status: 404 });
    }

    // Generate verification URL
    const origin = request.headers.get('origin') || request.headers.get('host') || '';
    const protocol = origin.includes('localhost') ? 'http' : 'https';
    const baseUrl = origin.startsWith('http') ? origin : `${protocol}://${origin}`;
    const verificationUrl = invoice.publicId
      ? `${baseUrl}/view/tour-invoice/${invoice.publicId}`
      : null;

    // Generate QR code
    let qrCodeDataUrl: string | null = null;
    if (verificationUrl) {
      try {
        qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 150,
          margin: 1,
          color: { dark: '#1f2937', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        });
      } catch {
        // ignore QR generation errors
      }
    }

    const pdfData = {
      businessName: team.businessName || team.name || 'Your Business',
      logoUrl: team.logoUrl,
      tpn: team.tpn,
      gstNumber: team.gstNumber,
      licenseNumber: team.licenseNumber,
      address: team.address,
      city: team.city,
      dzongkhag: team.dzongkhag,
      bankAccounts,

      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      currency: invoice.currency,

      customer: {
        name: invoice.customer?.name || 'N/A',
        email: invoice.customer?.email,
        phone: invoice.customer?.phone,
        address: invoice.customer?.address,
        tpn: invoice.customer?.tpn,
      },

      tourName: invoice.tourName,
      tourType: invoice.tourType,
      arrivalDate: invoice.arrivalDate,
      departureDate: invoice.departureDate,
      numberOfNights: invoice.numberOfNights,
      numberOfGuests: invoice.numberOfGuests,
      guestNationality: invoice.guestNationality,
      tourGuide: invoice.tourGuide,

      guests: invoice.guests.map((g: any) => ({
        guestName: g.guestName,
        nationality: g.nationality,
        passportNumber: g.passportNumber,
        visaNumber: g.visaNumber,
      })),

      items: invoice.items.map((item: any) => ({
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount || '0',
        isTaxExempt: item.isTaxExempt,
        itemTotal: item.itemTotal || '0',
      })),

      sdfPerPersonPerNight: invoice.sdfPerPersonPerNight,
      sdfTotal: invoice.sdfTotal,
      sdfBreakdown: invoice.guests.length > 0
        ? calcSDFMixed(
            invoice.guests.map((g: any) => ({ nationality: g.nationality })),
            invoice.numberOfNights
          ).breakdown
        : undefined,

      inclusions: (invoice.inclusions as string[]) || [],
      exclusions: (invoice.exclusions as string[]) || [],

      subtotal: invoice.subtotal,
      totalDiscount: invoice.totalDiscount,
      totalTax: invoice.totalTax,
      grandTotal: invoice.grandTotal,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,

      paymentTerms: invoice.paymentTerms,
      customerNotes: invoice.customerNotes,
      termsAndConditions: invoice.termsAndConditions || (team as any).invoiceTerms,

      qrCodeDataUrl,
    };

    const accentColor = (team as any).invoiceAccentColor || '#1f2937';
    const pdfStream = await generateTourInvoicePDF(pdfData, accentColor);
    const filename = getTourInvoicePDFFilename(invoice.invoiceNumber);

    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk as Buffer);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating tour invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
});
