'use client';

import { useState, useActionState, useTransition, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { updateSupplier, deleteSupplier } from '@/lib/suppliers/actions';
import { SupplierForm } from '@/components/suppliers/supplier-form';
import { Supplier } from '@/lib/db/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = Number(params.id);

  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, formAction] = useActionState(updateSupplier, { error: '' });

  useEffect(() => {
    fetch(`/api/suppliers/${supplierId}`)
      .then((res) => res.json())
      .then((data) => {
        setSupplier(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching supplier:', error);
        setLoading(false);
      });
  }, [supplierId]);

  if (state.success) {
    router.push('/suppliers');
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('id', supplierId.toString());

    startTransition(() => {
      formAction(formData);
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSupplier(null, new FormData());
      if (result.success) {
        router.push('/suppliers');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading supplier...</p>
        </div>
      </section>
    );
  }

  if (!supplier) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Supplier not found</p>
          <Link href="/suppliers">
            <Button variant="outline" className="mt-4">
              Back to Suppliers
            </Button>
          </Link>
        </div>
      </section>
    );
  }

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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
              Edit Supplier
            </h1>
            <p className="text-sm text-gray-500">
              Update supplier information
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {supplier.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <SupplierForm supplier={supplier} />

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
            {isPending ? 'Saving...' : 'Save Changes'}
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
