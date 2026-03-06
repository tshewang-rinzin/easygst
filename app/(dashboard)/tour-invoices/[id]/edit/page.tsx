import { notFound, redirect } from 'next/navigation';
import { getTeamForUser } from '@/lib/db/queries';
import { getTourInvoice } from '@/lib/db/tour-invoice-queries';
import { TourInvoiceForm } from '../../components/tour-invoice-form';

export default async function EditTourInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getTeamForUser();
  if (!team) redirect('/sign-in');

  const invoice = await getTourInvoice(id);
  if (!invoice) notFound();
  if (invoice.isLocked) redirect(`/tour-invoices/${id}`);

  // Pass existing customer for pre-selection
  const initialCustomer = invoice.customer
    ? { id: invoice.customer.id, name: invoice.customer.name, email: invoice.customer.email, phone: invoice.customer.phone }
    : null;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">Edit Tour Invoice</h1>
        <p className="text-sm text-gray-500">{invoice.invoiceNumber} — {invoice.tourName}</p>
      </div>
      <TourInvoiceForm
        existingInvoice={invoice}
        existingItems={invoice.items}
        existingGuests={invoice.guests}
        initialCustomer={initialCustomer}
      />
    </section>
  );
}
