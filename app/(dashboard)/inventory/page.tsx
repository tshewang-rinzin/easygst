'use client';

import { useState, useActionState, useEffect } from 'react';
import { FeatureGate } from '@/components/feature-gate';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertTriangle, Package, PlusCircle, MinusCircle, ArrowUpDown, Loader2 } from 'lucide-react';
import { adjustStock } from '@/lib/inventory/actions';
import type { Product, ProductVariant } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function LowStockAlerts() {
  const { data } = useSWR<{
    products: Product[];
    variants: Array<{ variant: ProductVariant; productName: string }>;
  }>('/api/inventory?type=low-stock', fetcher);

  const totalAlerts = (data?.products?.length || 0) + (data?.variants?.length || 0);
  if (totalAlerts === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Low Stock Alerts ({totalAlerts})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data?.products?.map((p) => (
            <div key={p.id} className="flex justify-between items-center text-sm">
              <span className="font-medium text-red-800">{p.name}</span>
              <Badge variant="destructive">
                {p.stockQuantity} / {p.lowStockThreshold} threshold
              </Badge>
            </div>
          ))}
          {data?.variants?.map((v) => (
            <div key={v.variant.id} className="flex justify-between items-center text-sm">
              <span className="font-medium text-red-800">{v.productName} — {v.variant.name}</span>
              <Badge variant="destructive">
                {v.variant.stockQuantity} / {v.variant.lowStockThreshold} threshold
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StockAdjustmentDialog({ product, variant, onSuccess }: {
  product: { id: string; name: string };
  variant?: { id: string; name: string };
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(adjustStock, {} as any);

  useEffect(() => {
    if (state && 'success' in state && state.success) {
      setOpen(false);
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowUpDown className="h-3 w-3 mr-1" />
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Adjust Stock — {product.name}{variant ? ` (${variant.name})` : ''}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="productId" value={product.id} />
          {variant && <input type="hidden" name="variantId" value={variant.id} />}
          <input type="hidden" name="referenceType" value="manual" />

          <div>
            <Label>Type</Label>
            <select
              name="type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="in">Stock In (+)</option>
              <option value="out">Stock Out (-)</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          <div>
            <Label>Quantity</Label>
            <Input name="quantity" type="number" min="1" required placeholder="Enter quantity" />
          </div>

          <div>
            <Label>Reason</Label>
            <Input name="reason" required placeholder="e.g., Purchase order, Damaged goods" />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Input name="notes" placeholder="Additional notes" />
          </div>

          {state && 'error' in state && state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="bg-orange-500 hover:bg-orange-600">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Adjustment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const { data, mutate } = useSWR<{
    trackedProducts: Product[];
    variants: Array<{ variant: ProductVariant; productName: string; productId: string }>;
  }>('/api/inventory', fetcher);

  const { data: movements } = useSWR<Array<{
    movement: any;
    productName: string;
    variantName: string | null;
    userName: string | null;
  }>>('/api/inventory?type=movements', fetcher);

  const handleAdjustSuccess = () => {
    mutate();
  };

  return (
    <FeatureGate feature="inventory">
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Inventory Management
        </h1>
        <p className="text-sm text-gray-500">
          Track stock levels and manage inventory
        </p>
      </div>

      <LowStockAlerts />

      {/* Stock Levels */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!data?.trackedProducts?.length && !data?.variants?.length) ? (
            <p className="text-gray-500 text-center py-8">
              No products with inventory tracking enabled.
              <br />
              Enable &quot;Track Inventory&quot; on products to see them here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.trackedProducts?.map((product) => {
                  // Check if this product has variants (shown separately)
                  const hasVariants = data.variants?.some(v => v.productId === product.id);
                  if (hasVariants) return null;

                  const isLow = product.stockQuantity <= product.lowStockThreshold;
                  return (
                    <TableRow key={product.id} className={isLow ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-gray-400">—</TableCell>
                      <TableCell className="text-sm text-gray-500">{product.sku || '—'}</TableCell>
                      <TableCell className={`text-right font-bold ${isLow ? 'text-red-600' : ''}`}>
                        {product.stockQuantity}
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        {product.lowStockThreshold}
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <StockAdjustmentDialog
                          product={{ id: product.id, name: product.name }}
                          onSuccess={handleAdjustSuccess}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {data?.variants?.map((v) => {
                  const isLow = v.variant.stockQuantity <= v.variant.lowStockThreshold;
                  return (
                    <TableRow key={v.variant.id} className={isLow ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{v.productName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{v.variant.name}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{v.variant.sku || '—'}</TableCell>
                      <TableCell className={`text-right font-bold ${isLow ? 'text-red-600' : ''}`}>
                        {v.variant.stockQuantity}
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        {v.variant.lowStockThreshold}
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <StockAdjustmentDialog
                          product={{ id: v.productId, name: v.productName }}
                          variant={{ id: v.variant.id, name: v.variant.name }}
                          onSuccess={handleAdjustSuccess}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inventory Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {!movements?.length ? (
            <p className="text-gray-500 text-center py-4">No inventory movements yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.movement.id}>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(m.movement.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {m.productName}
                      {m.variantName && (
                        <span className="text-gray-400 ml-1">({m.variantName})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          m.movement.type === 'in'
                            ? 'bg-green-50 text-green-700'
                            : m.movement.type === 'out'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }
                      >
                        {m.movement.type === 'in' ? '↑ In' : m.movement.type === 'out' ? '↓ Out' : '↔ Adj'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${m.movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.movement.quantity > 0 ? '+' : ''}{m.movement.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{m.movement.reason || '—'}</TableCell>
                    <TableCell className="text-sm text-gray-500">{m.userName || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
    </FeatureGate>
  );
}
