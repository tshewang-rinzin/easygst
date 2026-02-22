import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getInvoiceWithDetails } from '@/lib/invoices/queries';
import { getActiveBankAccounts } from '@/lib/bank-accounts/queries';
import { generateInvoicePDF, getInvoicePDFFilename, InvoiceTemplateType } from '@/lib/pdf/generator';

export const GET = withAuth(async (request: NextRequest, { team, params }) => {
  try {
    const [invoice, bankAccounts] = await Promise.all([
      getInvoiceWithDetails(params.id),
      getActiveBankAccounts().catch(() => []),
    ]);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate verification URL using the request origin
    const origin = request.headers.get('origin') || request.headers.get('host') || '';
    const protocol = origin.includes('localhost') ? 'http' : 'https';
    const baseUrl = origin.startsWith('http') ? origin : `${protocol}://${origin}`;
    const verificationUrl = invoice.publicId
      ? `${baseUrl}/verify/${invoice.publicId}`
      : null;

    // Prepare invoice data for PDF
    const pdfData = {
      // Business Info
      businessName: team.name || 'Your Business',
      logoUrl: team.logoUrl,
      tpn: team.tpn,
      gstNumber: team.gstNumber,
      licenseNumber: team.licenseNumber,
      address: team.address,
      city: team.city,
      dzongkhag: team.dzongkhag,
      // Legacy fields (deprecated but kept for backward compatibility)
      bankName: team.bankName,
      bankAccountNumber: team.bankAccountNumber,
      // Bank Accounts (new)
      bankAccounts: bankAccounts,

      // Invoice Info
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      currency: invoice.currency,
      publicId: invoice.publicId,

      // Customer Info
      customer: {
        name: invoice.customer?.name || 'N/A',
        email: invoice.customer?.email,
        phone: invoice.customer?.phone,
        address: invoice.customer?.address,
        tpn: invoice.customer?.tpn,
      },

      // Line Items
      items: invoice.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount || '0',
        isTaxExempt: item.isTaxExempt,
        gstClassification: item.gstClassification,
        itemTotal: item.itemTotal || '0',
      })),

      // Totals
      subtotal: invoice.subtotal,
      totalDiscount: invoice.totalDiscount,
      totalTax: invoice.totalTax,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,

      // Notes
      paymentTerms: invoice.paymentTerms,
      customerNotes: invoice.customerNotes,
      termsAndConditions: team.invoiceTerms,

      // Verification
      verificationUrl,
    };

    // Generate PDF with template settings
    const templateType = (team.invoiceTemplate as InvoiceTemplateType) || 'classic';
    const accentColor = team.invoiceAccentColor || '#1f2937';
    const pdfStream = await generateInvoicePDF(pdfData, templateType, accentColor);
    const filename = getInvoicePDFFilename(invoice.invoiceNumber);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk as Buffer);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
});
