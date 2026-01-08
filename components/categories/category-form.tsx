'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
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

  const action = mode === 'create' ? createCategory : updateCategory;

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    {}
  );

  const handleSubmit = async (formData: FormData) => {
    formData.set('isActive', String(isActive));
    if (mode === 'edit' && category) {
      formData.set('id', String(category.id));
    }

    const result = await formAction(formData);

    if (result?.success) {
      router.push('/products/categories');
    }
  };

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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={category?.description || ''}
              placeholder="Optional description for this category"
              rows={3}
            />
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
