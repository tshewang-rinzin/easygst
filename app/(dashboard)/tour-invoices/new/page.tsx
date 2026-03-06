import { getTeamForUser } from '@/lib/db/queries';
import { TourInvoiceForm } from '../components/tour-invoice-form';
import { redirect } from 'next/navigation';

export default async function NewTourInvoicePage() {
  const team = await getTeamForUser();
  if (!team) redirect('/sign-in');

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">New Tour Invoice</h1>
        <p className="text-sm text-gray-500">Create a new tour package invoice</p>
      </div>
      <TourInvoiceForm />
    </section>
  );
}
