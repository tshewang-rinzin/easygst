import { getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { TourInvoiceForm } from '../components/tour-invoice-form';
import { redirect } from 'next/navigation';

export default async function NewTourInvoicePage() {
  const team = await getTeamForUser();
  if (!team) redirect('/sign-in');

  const customerList = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(and(eq(customers.teamId, team.id), eq(customers.isActive, true)))
    .orderBy(customers.name);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">New Tour Invoice</h1>
        <p className="text-sm text-gray-500">Create a new tour package invoice</p>
      </div>
      <TourInvoiceForm customers={customerList} />
    </section>
  );
}
