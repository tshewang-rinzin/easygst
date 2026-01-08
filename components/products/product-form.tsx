'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Product, Unit } from '@/lib/db/schema';
import { CategorySelector } from './category-selector';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import useSWR from 'swr';
import type { TaxClassification } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ProductFormProps {
  product?: Product | null;
  defaultGstRate?: string;
}

export function ProductForm({ product, defaultGstRate = '0' }: ProductFormProps) {
  const [useDefaultGst, setUseDefaultGst] = useState(!product || !product.defaultTaxRate);
  const defaultRate = parseFloat(defaultGstRate || '0');
  const { data: units } = useSWR<Unit[]>('/api/units', fetcher);
  const { data: taxClassifications } = useSWR<TaxClassification[]>('/api/tax-classifications', fetcher);
  return (
    <div className="space-y-6">
      {/* Product Information */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2">
              Product/Service Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Monthly Consulting Service, Widget A"
              defaultValue={product?.name || ''}
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="mb-2">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detailed description of the product or service..."
              defaultValue={product?.description || ''}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku" className="mb-2">
                SKU (Stock Keeping Unit)
              </Label>
              <Input
                id="sku"
                name="sku"
                placeholder="e.g., PROD-001"
                defaultValue={product?.sku || ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional unique identifier
              </p>
            </div>
            <div>
              <CategorySelector
                defaultCategoryId={product?.categoryId}
                defaultCategoryName={product?.category}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing & Unit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unitPrice" className="mb-2">
                Unit Price <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={
                  product?.unitPrice
                    ? parseFloat(product.unitPrice).toFixed(2)
                    : ''
                }
                required
              />
              <p className="text-xs text-gray-500 mt-1">Price in BTN</p>
            </div>
            <div>
              <Label htmlFor="unit" className="mb-2 flex items-center justify-between">
                <span>Unit of Measurement</span>
                <Link
                  href="/settings/units"
                  className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Manage Units
                </Link>
              </Label>
              <select
                id="unit"
                name="unit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                defaultValue={product?.unit || (units?.[0]?.name || 'piece')}
              >
                {units && units.length > 0 ? (
                  units.map((unit) => (
                    <option key={unit.id} value={unit.name}>
                      {unit.name} ({unit.abbreviation})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="piece">Piece (pcs)</option>
                    <option value="hour">Hour (hr)</option>
                    <option value="service">Service (svc)</option>
                  </>
                )}
              </select>
              {(!units || units.length === 0) && (
                <p className="text-xs text-gray-500 mt-1">
                  <Link href="/settings/units" className="text-orange-600 hover:underline">
                    Add custom units
                  </Link> in settings
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>GST Configuration</span>
            <div className="flex gap-2">
              <Link
                href="/settings/tax-classifications"
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                Tax Classifications
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/settings/tax"
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                Default Rate
              </Link>
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Set GST rate as per Bhutan DRC (Department of Revenue and Customs) guidelines
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gstClassification" className="mb-2">
              GST Classification <span className="text-red-500">*</span>
            </Label>
            <select
              id="gstClassification"
              name="gstClassification"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              defaultValue={product?.gstClassification || 'STANDARD'}
              required
            >
              {taxClassifications && taxClassifications.length > 0 ? (
                taxClassifications.map((classification) => (
                  <option key={classification.id} value={classification.code}>
                    {classification.name} - {classification.description}
                  </option>
                ))
              ) : (
                <>
                  <option value="STANDARD">Standard - Taxable items with standard GST rates</option>
                  <option value="ZERO_RATED">Zero-Rated - 0% GST items (exports, essential goods)</option>
                  <option value="EXEMPT">Exempt - GST exempt items (medical, educational)</option>
                </>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              This classification will be automatically applied when adding this product to invoices
            </p>
            {(!taxClassifications || taxClassifications.length === 0) && (
              <p className="text-xs text-gray-500 mt-1">
                <Link href="/settings/tax-classifications" className="text-orange-600 hover:underline">
                  Configure tax classifications
                </Link> in settings
              </p>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <Checkbox
                id="useDefaultGst"
                checked={useDefaultGst}
                onCheckedChange={(checked) => setUseDefaultGst(checked === true)}
              />
              <div className="flex-1">
                <Label
                  htmlFor="useDefaultGst"
                  className="cursor-pointer font-medium"
                >
                  Use Business Default GST Rate ({defaultRate}%)
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Apply the business-wide default GST rate configured in settings
                </p>
              </div>
            </div>
          </div>

          {!useDefaultGst && (
            <>
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="isTaxExempt"
                  name="isTaxExempt"
                  defaultChecked={product?.isTaxExempt || false}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="isTaxExempt" className="cursor-pointer">
                    GST Exempt Product
                  </Label>
                  <p className="text-xs text-gray-500">
                    Check if this product is exempt from GST (e.g., essential goods, medical supplies)
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="defaultTaxRate" className="mb-2">
                  Custom GST Rate (%) <span className="text-red-500">*</span>
                </Label>
                <select
                  id="defaultTaxRate"
                  name="defaultTaxRate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  defaultValue={
                    product?.defaultTaxRate
                      ? parseFloat(product.defaultTaxRate).toString()
                      : defaultRate.toString()
                  }
                  required
                >
                  <option value="0">0% - Essential Items / GST Exempt</option>
                  <option value="5">5% - Reduced Rate</option>
                  <option value="10">10% - Lower Standard Rate</option>
                  <option value="20">20% - Standard Rate</option>
                  <option value="30">30% - Standard Goods & Services</option>
                  <option value="50">50% - Luxury Goods & Premium Items</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Override the default rate for this specific product
                </p>
              </div>
            </>
          )}

          {useDefaultGst && (
            <input
              type="hidden"
              name="defaultTaxRate"
              value={defaultRate.toString()}
            />
          )}
        </CardContent>
      </Card>

      {/* Hidden field for isActive */}
      <input type="hidden" name="isActive" value="true" />
    </div>
  );
}
