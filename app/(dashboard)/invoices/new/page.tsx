import { getTeamForUser } from '@/lib/db/queries';
import { InvoiceFormNew } from '@/components/invoices/invoice-form-new';

export default async function NewInvoicePage() {
  const team = await getTeamForUser();

  return <InvoiceFormNew defaultGstRate={team?.defaultGstRate || '0'} />;
}
