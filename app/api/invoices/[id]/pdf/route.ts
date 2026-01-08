import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceWithDetails } from '@/lib/invoices/queries';
import { getTeamForUser } from '@/lib/db/queries';
import { getActiveBankAccounts } from '@/lib/bank-accounts/queries';
import { generateInvoicePDF, getInvoicePDFFilename } from '@/lib/pdf/generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const [invoice, team, bankAccounts] = await Promise.all([
      getInvoiceWithDetails(invoiceId),
      getTeamForUser(),
      getActiveBankAccounts().catch(() => []), // Gracefully handle if no bank accounts
    ]);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

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

      // Customer Info
      customer: {
        name: invoice.customer?.name || 'N/A',
        email: invoice.customer?.email,
        phone: invoice.customer?.phone,
        address: invoice.customer?.address,
        tpn: invoice.customer?.tpn,
      },

      // Line Items
      items: invoice.items.map((item) => ({
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
    };

    // Generate PDF
    const pdfStream = await generateInvoicePDF(pdfData);
    const filename = getInvoicePDFFilename(invoice.invoiceNumber);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
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
}
