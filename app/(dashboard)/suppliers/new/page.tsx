'use client';

import { useState, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createSupplier } from '@/lib/suppliers/actions';
import { SupplierForm } from '@/components/suppliers/supplier-form';

export default function NewSupplierPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(createSupplier, { error: '' });

  if (state.success) {
    router.push('/suppliers');
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/suppliers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Suppliers
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Add New Supplier
        </h1>
        <p className="text-sm text-gray-500">
          Create a new supplier for managing purchases
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <SupplierForm />

        {state.error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isPending ? 'Creating...' : 'Create Supplier'}
          </Button>
          <Link href="/suppliers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </section>
  );
}
