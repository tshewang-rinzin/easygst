'use client';

import { useState, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { createProduct } from '@/lib/products/actions';
import useSWR, { mutate } from 'swr';
import type { Unit, TaxClassification } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface QuickAddProductDialogProps {
  defaultGstRate?: string;
  onProductCreated?: () => void;
}

export function QuickAddProductDialog({
  defaultGstRate = '0',
  onProductCreated
}: QuickAddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  const { data: units } = useSWR<Unit[]>('/api/units', fetcher);
  const { data: taxClassifications } = useSWR<TaxClassification[]>('/api/tax-classifications', fetcher);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const result = await createProduct(null, formData);

    setIsPending(false);

    if (result.success) {
      // Refresh products list
      mutate('/api/products');

      // Close dialog
      setOpen(false);

      // Reset form
      e.currentTarget.reset();
      setIsTaxExempt(false);

      // Notify parent component
      if (onProductCreated) {
        onProductCreated();
      }
    } else {
      alert(result.error || 'Failed to create product');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Quick Add Product</DialogTitle>
            <DialogDescription>
              Add a new product to your catalog. You can edit details later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                Product/Service Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Monthly Consulting Service"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description..."
                rows={2}
              />
            </div>

            {/* SKU and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku" className="text-sm font-medium mb-2 block">
                  SKU
                </Label>
                <Input
                  id="sku"
                  name="sku"
                  placeholder="PROD-001"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-sm font-medium mb-2 block">
                  Category
                </Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g., Services"
                />
              </div>
            </div>

            {/* Unit Price and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unitPrice" className="text-sm font-medium mb-2 block">
                  Unit Price <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit" className="text-sm font-medium mb-2 block">
                  Unit <span className="text-red-500">*</span>
                </Label>
                <select
                  id="unit"
                  name="unit"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {units && units.length > 0 ? (
                    units.map((unit) => (
                      <option key={unit.id} value={unit.name}>
                        {unit.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="piece">Piece</option>
                      <option value="hour">Hour</option>
                      <option value="day">Day</option>
                      <option value="month">Month</option>
                      <option value="kg">Kg</option>
                      <option value="service">Service</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* GST Classification */}
            <div>
              <Label htmlFor="gstClassification" className="text-sm font-medium mb-2 block">
                GST Classification <span className="text-red-500">*</span>
              </Label>
              <select
                id="gstClassification"
                name="gstClassification"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {taxClassifications && taxClassifications.length > 0 ? (
                  taxClassifications.map((classification) => (
                    <option key={classification.id} value={classification.code}>
                      {classification.name} - {classification.description}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="standard">Standard Rated (GST applicable)</option>
                    <option value="zero_rated">Zero Rated (0% GST)</option>
                    <option value="exempt">Exempt (No GST)</option>
                  </>
                )}
              </select>
            </div>

            {/* Tax Rate and Tax Exempt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultTaxRate" className="text-sm font-medium mb-2 block">
                  Default GST Rate
                </Label>
                <select
                  id="defaultTaxRate"
                  name="defaultTaxRate"
                  disabled={isTaxExempt}
                  defaultValue={defaultGstRate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                  <option value="30">30%</option>
                  <option value="50">50%</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2 pb-2">
                  <input
                    type="checkbox"
                    id="isTaxExempt"
                    name="isTaxExempt"
                    checked={isTaxExempt}
                    onChange={(e) => setIsTaxExempt(e.target.checked)}
                    className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <Label htmlFor="isTaxExempt" className="text-sm font-medium cursor-pointer">
                    Tax Exempt
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden field for tax exempt */}
          <input type="hidden" name="isTaxExempt" value={isTaxExempt ? 'true' : 'false'} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isPending ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
