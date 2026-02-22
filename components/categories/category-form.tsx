'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { createCategory, updateCategory } from '@/lib/categories/actions';
import { Loader2 } from 'lucide-react';
import type { productCategories } from '@/lib/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Category = InferSelectModel<typeof productCategories>;

type ActionState = {
  error?: string;
  success?: string;
};

interface CategoryFormProps {
  category?: Category;
  mode: 'create' | 'edit';
}

export function CategoryForm({ category, mode }: CategoryFormProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [parentId, setParentId] = useState(category?.parentId || '');

  // Fetch all categories for parent selector
  const { data: categories } = useSWR<Array<{ id: string; name: string; depth: number; parentId: string | null }>>('/api/categories?format=dropdown', fetcher);

  const action = mode === 'create' ? createCategory : updateCategory;

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    {}
  );

  useEffect(() => {
    if ('success' in state && state.success) {
      router.push('/products/categories');
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    formData.set('isActive', String(isActive));
    formData.set('parentId', parentId || '');
    if (mode === 'edit' && category) {
      formData.set('id', String(category.id));
    }
    formAction(formData);
  };

  // Filter out current category and its children from parent options
  const availableParents = categories?.filter((c) => {
    if (mode === 'edit' && category) {
      return c.id !== category.id;
    }
    return true;
  });

  return (
    <form action={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Create Category' : 'Edit Category'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Category Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name}
              placeholder="e.g., Electronics, Stationery, Services"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category</Label>
            <select
              id="parentId"
              name="parentId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">— None (Top Level) —</option>
              {availableParents?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {'—'.repeat(cat.depth)}{cat.depth > 0 ? ' ' : ''}{cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Optional — select a parent to create a subcategory
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={category?.description || ''}
              placeholder="Optional description for this category"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={category?.sortOrder ?? 0}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label
              htmlFor="isActive"
              className="text-sm font-normal cursor-pointer"
            >
              Active (can be used in products)
            </Label>
          </div>

          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {state.success}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/products/categories')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : mode === 'create' ? (
              'Create Category'
            ) : (
              'Update Category'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
