'use client';

import { useActionState, use } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { updateCustomer, deleteCustomer } from '@/lib/customers/actions';
import { CustomerForm } from '@/components/customers/customer-form';
import { Customer } from '@/lib/db/schema';
import Link from 'next/link';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  error?: string;
  success?: string;
};

function CustomerEditForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [updateState, updateAction, isUpdating] = useActionState<
    ActionState,
    FormData
  >(updateCustomer, {});

  const [deleteState, deleteAction, isDeleting] = useActionState<
    ActionState,
    FormData
  >(deleteCustomer, {});

  // Redirect to customers list after delete
  if (deleteState.success) {
    router.push('/customers');
  }

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete ${customer.name}? This action cannot be undone.`
      )
    ) {
      const formData = new FormData();
      formData.append('id', customer.id.toString());
      deleteAction(formData);
    }
  };

  return (
    <div className="space-y-6">
      <form action={updateAction} className="space-y-6">
        {/* Hidden ID field for update */}
        <input type="hidden" name="id" value={customer.id} />

        <CustomerForm customer={customer} />

        {updateState.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {updateState.error}
          </div>
        )}
        {updateState.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {updateState.success}
          </div>
        )}

        <div className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Customer
              </>
            )}
          </Button>

          <div className="flex gap-4">
            <Link href="/customers">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isUpdating || isDeleting}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </form>

      {deleteState.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {deleteState.error}
        </div>
      )}
    </div>
  );
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: customer, isLoading } = useSWR<Customer>(
    `/api/customers/${id}`,
    fetcher
  );

  if (isLoading) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  if (!customer) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Customer not found
          </h2>
          <p className="text-gray-500 mb-4">
            The customer you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/customers">
            <Button>Back to Customers</Button>
          </Link>
        </div>
      </section>
    );
  }

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
          {customer.name}
        </h1>
        <p className="text-sm text-gray-500">Edit customer information</p>
      </div>

      <CustomerEditForm customer={customer} />
    </section>
  );
}
