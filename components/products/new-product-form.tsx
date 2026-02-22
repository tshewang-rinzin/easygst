'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/products/product-form';
import { createProduct } from '@/lib/products/actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface NewProductFormProps {
  defaultGstRate?: string;
}

export function NewProductForm({ defaultGstRate }: NewProductFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createProduct, {
    error: '',
  } as any);

  useEffect(() => {
    if ('success' in state && state.success) {
      // If product was created with variants, redirect to edit page to manage them
      if ('hasVariants' in state && state.hasVariants && 'productId' in state && state.productId) {
        router.push(`/products/${state.productId}`);
      } else {
        router.push('/products');
      }
    }
  }, [state, router]);

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
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Add New Product
        </h1>
        <p className="text-sm text-gray-500">
          Create a new product or service for your catalog
        </p>
      </div>

      <form action={formAction}>
        <ProductForm defaultGstRate={defaultGstRate} />

        {'error' in state && state.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <Button
            type="submit"
            disabled={pending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {pending ? 'Creating...' : 'Create Product'}
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
