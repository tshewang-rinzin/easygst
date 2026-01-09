import { getTeamForUser } from '@/lib/db/queries';
import { SupplierBillForm } from '@/components/suppliers/supplier-bill-form';

export default async function NewSupplierBillPage() {
  const team = await getTeamForUser();

  return <SupplierBillForm defaultGstRate={team?.defaultGstRate || '0'} />;
}
