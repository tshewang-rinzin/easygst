import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getQuotationById } from '@/lib/quotations/queries';
import { getTeamForUser } from '@/lib/db/queries';
import { QuotationFormEdit } from '@/components/quotations/quotation-form-edit';

async function EditQuotationForm({ id }: { id: string }) {
  const [quotation, team] = await Promise.all([
    getQuotationById(id),
    getTeamForUser(),
  ]);

  if (!quotation) {
    notFound();
  }

  if (!['draft', 'sent'].includes(quotation.status)) {
    redirect(`/quotations/${id}`);
  }

  return (
    <QuotationFormEdit
      quotation={{
        id: quotation.id,
        quotationNumber: quotation.quotationNumber,
        customerId: quotation.customerId,
        customerName: quotation.customer?.name || '',
        customerEmail: quotation.customer?.email || null,
        customerPhone: quotation.customer?.phone || null,
        quotationDate: quotation.quotationDate,
        validUntil: quotation.validUntil,
        currency: quotation.currency,
        notes: quotation.notes || '',
        customerNotes: quotation.customerNotes || '',
        termsAndConditions: quotation.termsAndConditions || '',
        items: quotation.items.map((item) => ({
          productId: item.productId || undefined,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'piece',
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || '0',
          taxRate: item.taxRate,
          isTaxExempt: item.isTaxExempt,
        })),
      }}
      defaultGstRate={team?.defaultGstRate || '0'}
    />
  );
}

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="flex-1 p-4 lg:p-8 animate-pulse"><div className="h-96 bg-gray-200 rounded-lg"></div></div>}>
      <EditQuotationForm id={id} />
    </Suspense>
  );
}
