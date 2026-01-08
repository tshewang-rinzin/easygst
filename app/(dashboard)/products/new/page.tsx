import { getTeamForUser } from '@/lib/db/queries';
import { NewProductForm } from '@/components/products/new-product-form';

export default async function NewProductPage() {
  const team = await getTeamForUser();

  return (
    <NewProductForm
      defaultGstRate={team?.defaultGstRate || '0'}
    />
  );
}
