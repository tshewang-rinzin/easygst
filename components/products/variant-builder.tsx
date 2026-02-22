'use client';

import { useState, useEffect, useActionState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, X, Loader2, Trash2, DollarSign, Package2 } from 'lucide-react';
import { saveProductVariants } from '@/lib/products/actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Attribute {
  name: string;
  values: string[];
}

interface Variant {
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

interface VariantBuilderProps {
  productId: string;
  productSku?: string;
  trackInventory: boolean;
}

export function VariantBuilder({ productId, productSku = '', trackInventory }: VariantBuilderProps) {
  const { data: existingData, mutate } = useSWR<{
    attributes: Array<{ name: string; values: any; sortOrder: number }>;
    variants: Array<{
      name: string;
      sku: string | null;
      attributeValues: any;
      unitPrice: string | null;
      costPrice: string | null;
      stockQuantity: number;
      lowStockThreshold: number;
      isActive: boolean;
    }>;
  }>(`/api/products/${productId}/variants`, fetcher);

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');

  // Load existing data
  useEffect(() => {
    if (existingData) {
      if (existingData.attributes?.length) {
        setAttributes(existingData.attributes.map((a) => ({
          name: a.name,
          values: Array.isArray(a.values) ? a.values : [],
        })));
      }
      if (existingData.variants?.length) {
        setVariants(existingData.variants.map((v) => ({
          name: v.name,
          sku: v.sku || '',
          barcode: (v as any).barcode || '',
          attributeValues: v.attributeValues as Record<string, string>,
          unitPrice: v.unitPrice || '',
          costPrice: v.costPrice || '',
          stockQuantity: v.stockQuantity,
          lowStockThreshold: v.lowStockThreshold,
          isActive: v.isActive,
        })));
      }
    }
  }, [existingData]);

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

  const generateVariants = () => {
    if (attributes.length === 0) {
      setVariants([]);
      return;
    }

    // Generate all combinations
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

    const newVariants: Variant[] = combinations.map((combo) => {
      const attributeValues = combo.reduce((acc, c) => ({ ...acc, ...c }), {});
      const name = Object.values(attributeValues).join(' / ');

      // Preserve existing variant data if it matches
      const existing = variants.find((v) => v.name === name);

      return {
        name,
        sku: existing?.sku || generateSkuForVariant(productSku, attributeValues),
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
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<{ success?: string; error?: string }>({});

  const handleSave = async () => {
    setSaving(true);
    setSaveState({});
    const formData = new FormData();
    formData.set('productId', productId);
    formData.set('attributes', JSON.stringify(attributes));
    formData.set('variants', JSON.stringify(variants.map((v) => ({
      ...v,
      unitPrice: v.unitPrice === '' ? null : parseFloat(v.unitPrice),
      costPrice: v.costPrice === '' ? null : parseFloat(v.costPrice),
      barcode: v.barcode || null,
    }))));

    const result = await (saveProductVariants as any)({}, formData);
    setSaveState(result);
    setSaving(false);
    if (result.success) mutate();
  };

  return (
    <div className="space-y-6">
      {/* Attribute Definitions */}
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
              Generate Variants ({attributes.reduce((total, attr) => total * attr.values.length, 1)})
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Variants Table */}
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
                    <TableHead>Price Override</TableHead>
                    <TableHead>Cost Price</TableHead>
                    {trackInventory && <TableHead>Stock</TableHead>}
                    {trackInventory && <TableHead>Low Threshold</TableHead>}
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
                          className="h-8 w-28 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={variant.barcode}
                          onChange={(e) => updateVariant(idx, 'barcode', e.target.value)}
                          placeholder="Barcode"
                          className="h-8 w-28 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.unitPrice}
                          onChange={(e) => updateVariant(idx, 'unitPrice', e.target.value)}
                          placeholder="Default"
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
                      {trackInventory && (
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={variant.lowStockThreshold}
                            onChange={(e) => updateVariant(idx, 'lowStockThreshold', parseInt(e.target.value) || 0)}
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

      {/* Save Button */}
      {(attributes.length > 0 || variants.length > 0) && (
        <form action={handleSave}>
          <Button
            type="submit"
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Variants...
              </>
            ) : (
              'Save Variants'
            )}
          </Button>

          {saveState && 'success' in saveState && saveState.success && (
            <span className="ml-3 text-sm text-green-600">{saveState.success}</span>
          )}
          {saveState && 'error' in saveState && saveState.error && (
            <span className="ml-3 text-sm text-red-600">{saveState.error}</span>
          )}
        </form>
      )}
    </div>
  );
}
