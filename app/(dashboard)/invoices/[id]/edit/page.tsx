import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getInvoiceWithDetails } from '@/lib/invoices/queries';
import { getTeamForUser } from '@/lib/db/queries';
import { InvoiceFormEdit } from '@/components/invoices/invoice-form-edit';

async function EditInvoiceForm({ id }: { id: number }) {
  const [invoice, team] = await Promise.all([
    getInvoiceWithDetails(id),
    getTeamForUser(),
  ]);

  if (!invoice) {
    notFound();
  }

  // Only allow editing draft invoices that are not locked
  if (invoice.status !== 'draft') {
    redirect(`/invoices/${id}`);
  }

  if (invoice.isLocked) {
    redirect(`/invoices/${id}`);
  }

  return (
    <InvoiceFormEdit
      invoice={{
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customer: {
          id: invoice.customer?.id || 0,
          name: invoice.customer?.name || '',
          email: invoice.customer?.email || null,
          phone: invoice.customer?.phone || null,
        },
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        items: invoice.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'piece',
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || '0',
          taxRate: item.taxRate,
          isTaxExempt: item.isTaxExempt,
        })),
        paymentTerms: invoice.paymentTerms,
        notes: invoice.notes,
        customerNotes: invoice.customerNotes,
      }}
      defaultGstRate={team?.defaultGstRate || '5'}
    />
  );
}

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoiceId = parseInt(id);

  return (
    <Suspense
      fallback={
        <div className="flex-1 p-4 lg:p-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading invoice...</p>
          </div>
        </div>
      }
    >
      <EditInvoiceForm id={invoiceId} />
    </Suspense>
  );
}
