import { getTeamForUser } from '@/lib/db/queries';
import { QuotationFormNew } from '@/components/quotations/quotation-form-new';

export default async function NewQuotationPage() {
  const team = await getTeamForUser();

  return <QuotationFormNew defaultGstRate={team?.defaultGstRate || '0'} />;
}
