import { getPaymentMethods, hasPaymentMethods } from '@/lib/payment-methods/queries';
import { PaymentMethodsList } from '@/components/payment-methods/payment-methods-list';

export default async function PaymentMethodsPage() {
  const methods = await getPaymentMethods();
  const hasAnyMethods = await hasPaymentMethods();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Payment Methods
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage payment methods available for recording invoice payments
          </p>
        </div>

        <PaymentMethodsList initialMethods={methods} hasAnyMethods={hasAnyMethods} />
      </div>
    </section>
  );
}
