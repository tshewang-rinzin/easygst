'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { createCustomer } from '@/lib/customers/actions';
import { CustomerForm } from '@/components/customers/customer-form';
import Link from 'next/link';
import { useEffect } from 'react';

type ActionState = {
  error?: string;
  success?: string;
  customerId?: string;
};

export default function NewCustomerPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createCustomer,
    {}
  );

  // Redirect to customer detail page on success
  useEffect(() => {
    if (state.success && state.customerId) {
      router.push(`/customers/${state.customerId}`);
    }
  }, [state.success, state.customerId, router]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/customers"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Add New Customer
        </h1>
        <p className="text-sm text-gray-500">
          Create a new customer record for invoicing
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        <CustomerForm />

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {state.error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Link href="/customers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Customer'
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
