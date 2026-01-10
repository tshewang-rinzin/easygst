'use client';

import { useActionState, useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/products/product-form';
import { updateProduct, deleteProduct } from '@/lib/products/actions';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import type { Product, Team } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const productId = parseInt(id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: product, error } = useSWR<Product>(
    `/api/products/${productId}`,
    fetcher
  );

  const { data: team } = useSWR<Team>('/api/team', fetcher);

  const [updateState, updateAction, updatePending] = useActionState(
    updateProduct,
    { error: '' }
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProduct,
    { error: '' }
  );

  useEffect(() => {
    if ('success' in updateState && updateState.success) {
      router.push('/products');
    }
  }, [updateState, router]);

  useEffect(() => {
    if ('success' in deleteState && deleteState.success) {
      router.push('/products');
    }
  }, [deleteState, router]);

  if (error) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load product</p>
          <Link href="/products">
            <Button variant="outline" className="mt-4">
              Back to Products
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading product...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Products
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
              Edit Product
            </h1>
            <p className="text-sm text-gray-500">
              Update product details and pricing
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Product
          </Button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="font-medium text-red-900 mb-2">
            Are you sure you want to delete this product?
          </h3>
          <p className="text-sm text-red-700 mb-4">
            This action cannot be undone. The product will be removed from your
            catalog.
          </p>
          <form action={deleteAction} className="flex gap-2">
            <input type="hidden" name="id" value={productId} />
            <Button
              type="submit"
              disabled={deletePending}
              variant="outline"
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deletePending ? 'Deleting...' : 'Yes, Delete Product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </form>
          {deleteState.error && (
            <p className="text-sm text-red-600 mt-2">{deleteState.error}</p>
          )}
        </div>
      )}

      <form action={updateAction}>
        <input type="hidden" name="id" value={productId} />
        <ProductForm
          product={product}
          defaultGstRate={team?.defaultGstRate || '0'}
        />

        {updateState.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{updateState.error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <Button
            type="submit"
            disabled={updatePending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {updatePending ? 'Updating...' : 'Update Product'}
          </Button>
          <Link href="/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </section>
  );
}
