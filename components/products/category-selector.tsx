'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CategoryDropdownItem {
  id: string;
  name: string;
  depth: number;
  parentId: string | null;
}

interface CategorySelectorProps {
  defaultCategoryId?: string | null;
  defaultCategoryName?: string | null;
}

export function CategorySelector({ defaultCategoryId, defaultCategoryName }: CategorySelectorProps) {
  const { data: categories } = useSWR<CategoryDropdownItem[]>('/api/categories?format=dropdown', fetcher);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    defaultCategoryId?.toString() || ''
  );
  const [manualCategory, setManualCategory] = useState<string>(
    defaultCategoryName || ''
  );
  const [useManual, setUseManual] = useState(!defaultCategoryId && !!defaultCategoryName);

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    if (value === 'manual') {
      setUseManual(true);
    } else {
      setUseManual(false);
      setManualCategory('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor="categoryId">Category</Label>
        <Link href="/products/categories/new" target="_blank">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-orange-600 hover:text-orange-700 h-auto p-0"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Add New
          </Button>
        </Link>
      </div>

      <select
        id="categoryId"
        name="categoryId"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        value={selectedCategoryId}
        onChange={(e) => handleCategoryChange(e.target.value)}
      >
        <option value="">-- Select Category --</option>
        {categories?.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {'—'.repeat(cat.depth)}{cat.depth > 0 ? ' ' : ''}{cat.name}
          </option>
        ))}
        <option value="manual">✏️ Enter manually</option>
      </select>

      {useManual && (
        <div className="mt-2">
          <Input
            id="category"
            name="category"
            placeholder="Enter category name"
            value={manualCategory}
            onChange={(e) => setManualCategory(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be saved as a custom category
          </p>
        </div>
      )}

      {!useManual && <input type="hidden" name="category" value="" />}
    </div>
  );
}
