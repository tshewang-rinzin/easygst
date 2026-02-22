'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Product, Unit } from '@/lib/db/schema';
import { CategorySelector } from './category-selector';
import Link from 'next/link';
import { Settings, Package, Briefcase, PlusCircle, Trash2, X } from 'lucide-react';
import useSWR from 'swr';
import type { TaxClassification } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface InlineAttribute {
  name: string;
  values: string[];
}

interface InlineVariant {
  name: string;
  sku: string;
  barcode: string;
  attributeValues: Record<string, string>;
  unitPrice: string;
  costPrice: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
}

function generateSkuForVariant(parentSku: string, attributeValues: Record<string, string>): string {
  const parts = Object.values(attributeValues).map(v => v.toUpperCase().replace(/\s+/g, '-'));
  const suffix = parts.join('-');
  const prefix = parentSku.trim().toUpperCase().replace(/\s+/g, '-');
  return prefix ? `${prefix}-${suffix}` : suffix;
}

function BulkAction({ label, onApply }: { label: string; onApply: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0"
        className="h-7 w-24 text-xs"
        autoFocus
      />
      <Button
        type="button"
        size="sm"
        className="h-7 text-xs bg-orange-500 hover:bg-orange-600"
        onClick={() => { onApply(value); setOpen(false); setValue(''); }}
      >
        Apply
      </Button>
      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setOpen(false); setValue(''); }}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface ProductFormProps {
  product?: Product | null;
  defaultGstRate?: string;
}

export function ProductForm({ product, defaultGstRate = '0' }: ProductFormProps) {
  const [useDefaultGst, setUseDefaultGst] = useState(!product || !product.defaultTaxRate);
  const defaultRate = parseFloat(defaultGstRate || '0');
  const { data: units } = useSWR<Unit[]>('/api/units', fetcher);
  const { data: taxClassifications } = useSWR<TaxClassification[]>('/api/tax-classifications', fetcher);

  const [productType, setProductType] = useState<'product' | 'service'>(
    (product?.productType as 'product' | 'service') || 'product'
  );
  const [trackInventory, setTrackInventory] = useState(product?.trackInventory ?? false);
  const [hasVariants, setHasVariants] = useState(false);

  // Inline variant builder state
  const [attributes, setAttributes] = useState<InlineAttribute[]>([]);
  const [variants, setVariants] = useState<InlineVariant[]>([]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');
  const [parentSku, setParentSku] = useState(product?.sku || '');

  const addAttribute = () => {
    if (!newAttrName.trim() || !newAttrValues.trim()) return;
    const values = newAttrValues.split(',').map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) return;
    setAttributes([...attributes, { name: newAttrName.trim(), values }]);
    setNewAttrName('');
    setNewAttrValues('');
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const generateVariants = useCallback(() => {
    if (attributes.length === 0) {
      setVariants([]);
      return;
    }

    const combinations: Record<string, string>[][] = [[]];
    for (const attr of attributes) {
      const newCombinations: Record<string, string>[][] = [];
      for (const combo of combinations) {
        for (const value of attr.values) {
          newCombinations.push([...combo, { [attr.name]: value }]);
        }
      }
      combinations.length = 0;
      combinations.push(...newCombinations);
    }

    const newVariants: InlineVariant[] = combinations.map((combo) => {
      const attributeValues = combo.reduce((acc, c) => ({ ...acc, ...c }), {});
      const name = Object.values(attributeValues).join(' / ');
      const existing = variants.find((v) => v.name === name);

      return {
        name,
        sku: existing?.sku || generateSkuForVariant(parentSku, attributeValues),
        barcode: existing?.barcode || '',
        attributeValues,
        unitPrice: existing?.unitPrice || '',
        costPrice: existing?.costPrice || '',
        stockQuantity: existing?.stockQuantity || 0,
        lowStockThreshold: existing?.lowStockThreshold || 0,
        isActive: existing?.isActive ?? true,
      };
    });

    setVariants(newVariants);
  }, [attributes, variants, parentSku]);

  const updateVariant = (index: number, field: keyof InlineVariant, value: any) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const variantCount = attributes.length > 0
    ? attributes.reduce((total, attr) => total * attr.values.length, 1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Product Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setProductType('product')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                productType === 'product'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Package className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Product</div>
                <div className="text-xs text-gray-500">Physical or digital goods</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setProductType('service'); setTrackInventory(false); setHasVariants(false); }}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                productType === 'service'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Briefcase className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Service</div>
                <div className="text-xs text-gray-500">Consulting, labor, etc.</div>
              </div>
            </button>
          </div>
          <input type="hidden" name="productType" value={productType} />
        </CardContent>
      </Card>

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
            {!hasVariants && (
              <div>
                <Label htmlFor="sku" className="mb-2">
                  SKU (Stock Keeping Unit)
                </Label>
                <Input
                  id="sku"
                  name="sku"
                  placeholder="e.g., PROD-001"
                  defaultValue={product?.sku || ''}
                  onChange={(e) => setParentSku(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional unique identifier
                </p>
              </div>
            )}
            {hasVariants && (
              <div>
                <Label htmlFor="sku" className="mb-2">
                  Parent SKU (used as prefix for variant SKUs)
                </Label>
                <Input
                  id="sku"
                  name="sku"
                  placeholder="e.g., TSHIRT"
                  value={parentSku}
                  onChange={(e) => setParentSku(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variants will use this as SKU prefix
                </p>
              </div>
            )}
            <div>
              <CategorySelector
                defaultCategoryId={product?.categoryId}
                defaultCategoryName={product?.category}
              />
            </div>
          </div>

          {/* Barcode field - always visible */}
          <div>
            <Label htmlFor="barcode" className="mb-2">
              Barcode
            </Label>
            <Input
              id="barcode"
              name="barcode"
              placeholder="e.g., 1234567890123"
              defaultValue={product?.barcode || ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Has Variants Toggle - only for products, only on new product (not edit) */}
      {productType === 'product' && !product && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hasVariantsToggle" className="text-base font-medium cursor-pointer">
                  This product has variants
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Enable if this product comes in different options like size, color, etc.
                </p>
              </div>
              <Switch
                id="hasVariantsToggle"
                checked={hasVariants}
                onCheckedChange={(checked: boolean) => {
                  setHasVariants(checked);
                  if (!checked) {
                    setAttributes([]);
                    setVariants([]);
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <input type="hidden" name="hasVariants" value={String(hasVariants)} />

      {/* Pricing Information - hidden when hasVariants */}
      {!hasVariants && (
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
                    (() => {
                      const categoryLabels: Record<string, string> = {
                        common: 'Common',
                        time: 'Time',
                        quantity: 'Quantity',
                        weight: 'Weight',
                        volume: 'Volume',
                        length: 'Length / Area',
                        other: 'Other',
                      };
                      const categoryOrder = ['common', 'time', 'quantity', 'weight', 'volume', 'length', 'other'];
                      const grouped = units.reduce<Record<string, typeof units>>((acc, unit) => {
                        const cat = (unit as any).category || 'other';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(unit);
                        return acc;
                      }, {});
                      return categoryOrder
                        .filter((cat) => grouped[cat]?.length)
                        .map((cat) => (
                          <optgroup key={cat} label={categoryLabels[cat] || cat}>
                            {grouped[cat].map((unit) => (
                              <option key={unit.id} value={unit.name}>
                                {unit.name} ({unit.abbreviation})
                              </option>
                            ))}
                          </optgroup>
                        ));
                    })()
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
      )}

      {/* When hasVariants, still need unitPrice and unit as hidden defaults */}
      {hasVariants && (
        <>
          <input type="hidden" name="unitPrice" value="0" />
          <Card>
            <CardHeader>
              <CardTitle>Unit of Measurement</CardTitle>
            </CardHeader>
            <CardContent>
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
                    (() => {
                      const categoryLabels: Record<string, string> = {
                        common: 'Common',
                        time: 'Time',
                        quantity: 'Quantity',
                        weight: 'Weight',
                        volume: 'Volume',
                        length: 'Length / Area',
                        other: 'Other',
                      };
                      const categoryOrder = ['common', 'time', 'quantity', 'weight', 'volume', 'length', 'other'];
                      const grouped = units.reduce<Record<string, typeof units>>((acc, unit) => {
                        const cat = (unit as any).category || 'other';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(unit);
                        return acc;
                      }, {});
                      return categoryOrder
                        .filter((cat) => grouped[cat]?.length)
                        .map((cat) => (
                          <optgroup key={cat} label={categoryLabels[cat] || cat}>
                            {grouped[cat].map((unit) => (
                              <option key={unit.id} value={unit.name}>
                                {unit.name} ({unit.abbreviation})
                              </option>
                            ))}
                          </optgroup>
                        ));
                    })()
                  ) : (
                    <>
                      <option value="piece">Piece (pcs)</option>
                      <option value="hour">Hour (hr)</option>
                      <option value="service">Service (svc)</option>
                    </>
                  )}
                </select>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Inventory Tracking (only for products without variants) */}
      {productType === 'product' && !hasVariants && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="trackInventory"
                checked={trackInventory}
                onCheckedChange={(checked) => setTrackInventory(checked === true)}
              />
              <Label htmlFor="trackInventory" className="cursor-pointer">
                Track inventory for this product
              </Label>
            </div>
            <input type="hidden" name="trackInventory" value={String(trackInventory)} />

            {trackInventory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stockQuantity" className="mb-2">
                    Current Stock
                  </Label>
                  <Input
                    id="stockQuantity"
                    name="stockQuantity"
                    type="number"
                    min="0"
                    defaultValue={product?.stockQuantity ?? 0}
                  />
                </div>
                <div>
                  <Label htmlFor="lowStockThreshold" className="mb-2">
                    Low Stock Threshold
                  </Label>
                  <Input
                    id="lowStockThreshold"
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    defaultValue={product?.lowStockThreshold ?? 5}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alert when stock falls below this number
                  </p>
                </div>
              </div>
            )}

            {!trackInventory && (
              <>
                <input type="hidden" name="stockQuantity" value="0" />
                <input type="hidden" name="lowStockThreshold" value="5" />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* When has variants, inventory is per-variant */}
      {productType === 'product' && hasVariants && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trackInventory"
                  checked={trackInventory}
                  onCheckedChange={(checked) => setTrackInventory(checked === true)}
                />
                <Label htmlFor="trackInventory" className="cursor-pointer">
                  Track inventory per variant
                </Label>
              </div>
              <input type="hidden" name="trackInventory" value={String(trackInventory)} />
            </CardContent>
          </Card>
          <input type="hidden" name="stockQuantity" value="0" />
          <input type="hidden" name="lowStockThreshold" value="0" />
        </>
      )}

      {productType === 'service' && (
        <>
          <input type="hidden" name="trackInventory" value="false" />
          <input type="hidden" name="stockQuantity" value="0" />
          <input type="hidden" name="lowStockThreshold" value="0" />
        </>
      )}

      {/* Inline Variant Builder */}
      {hasVariants && productType === 'product' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Variant Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attributes.length > 0 && (
                <div className="space-y-2">
                  {attributes.map((attr, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="font-medium text-sm min-w-[80px]">{attr.name}:</span>
                      <div className="flex flex-wrap gap-1 flex-1">
                        {attr.values.map((val) => (
                          <Badge key={val} variant="outline" className="text-xs">
                            {val}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttribute(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs mb-1">Attribute Name</Label>
                  <Input
                    placeholder="e.g., Color, Size"
                    value={newAttrName}
                    onChange={(e) => setNewAttrName(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex-[2]">
                  <Label className="text-xs mb-1">Values (comma-separated)</Label>
                  <Input
                    placeholder="e.g., Red, Blue, Green"
                    value={newAttrValues}
                    onChange={(e) => setNewAttrValues(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button
                  type="button"
                  onClick={addAttribute}
                  variant="outline"
                  size="sm"
                  className="h-9"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {attributes.length > 0 && (
                <Button
                  type="button"
                  onClick={generateVariants}
                  className="bg-orange-500 hover:bg-orange-600"
                  size="sm"
                >
                  Generate Variants ({variantCount})
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Variant Grid Preview */}
          {variants.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Variants ({variants.length})</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <BulkAction label="Set All Prices" onApply={(v) => setVariants(vs => vs.map(vr => ({ ...vr, unitPrice: v })))} />
                    <BulkAction label="Set All Cost Prices" onApply={(v) => setVariants(vs => vs.map(vr => ({ ...vr, costPrice: v })))} />
                    {trackInventory && (
                      <BulkAction label="Set All Stock" onApply={(v) => setVariants(vs => vs.map(vr => ({ ...vr, stockQuantity: parseInt(v) || 0 })))} />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Barcode</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Cost Price</TableHead>
                        {trackInventory && <TableHead>Stock</TableHead>}
                        <TableHead>Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-sm">
                            {variant.name}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={variant.sku}
                              onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                              placeholder="SKU"
                              className="h-8 w-32 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={variant.barcode}
                              onChange={(e) => updateVariant(idx, 'barcode', e.target.value)}
                              placeholder="Barcode"
                              className="h-8 w-32 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.unitPrice}
                              onChange={(e) => updateVariant(idx, 'unitPrice', e.target.value)}
                              placeholder="0.00"
                              className="h-8 w-24 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.costPrice}
                              onChange={(e) => updateVariant(idx, 'costPrice', e.target.value)}
                              placeholder="—"
                              className="h-8 w-24 text-xs"
                            />
                          </TableCell>
                          {trackInventory && (
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={variant.stockQuantity}
                                onChange={(e) => updateVariant(idx, 'stockQuantity', parseInt(e.target.value) || 0)}
                                className="h-8 w-20 text-xs"
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={variant.isActive}
                              onChange={(e) => updateVariant(idx, 'isActive', e.target.checked)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hidden inputs for variant data */}
          <input type="hidden" name="variantAttributes" value={JSON.stringify(attributes)} />
          <input type="hidden" name="variantData" value={JSON.stringify(variants.map(v => ({
            ...v,
            unitPrice: v.unitPrice === '' ? null : parseFloat(v.unitPrice),
            costPrice: v.costPrice === '' ? null : parseFloat(v.costPrice),
          })))} />
        </>
      )}

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
