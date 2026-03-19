'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { createSubscription } from '@/lib/subscriptions/actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');

  const { data: customersData } = useSWR('/api/customers', fetcher);
  const customers = customersData?.customers || customersData || [];
  const { data: productsData } = useSWR('/api/subscriptions/products', fetcher);

  // Filter products that have a billing cycle
  const packageProducts = (productsData || []).filter(
    (p: any) => p.billingCycle && p.billingCycle !== 'one_time'
  );

  const selectedProduct = packageProducts.find((p: any) => p.id === selectedProductId);

  const [state, formAction, isPending] = useActionState<any, FormData>(
    async (prevState: any, formData: FormData) => {
      const result = await createSubscription(prevState, formData);
      if (result && 'subscriptionId' in result) {
        router.push(`/subscriptions/${result.subscriptionId}`);
      }
      return result;
    },
    { error: '', success: '' }
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/subscriptions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Subscription</h1>
          <p className="text-gray-500 text-sm">Create a recurring billing subscription</p>
        </div>
      </div>

      {state?.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {state.error}
        </div>
      )}

      <form action={formAction}>
        <div className="space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="customerId" className="mb-2">
                Select Customer <span className="text-red-500">*</span>
              </Label>
              <select
                id="customerId"
                name="customerId"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Choose a customer...</option>
                {customers && Array.isArray(customers) && customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Package/Product */}
          <Card>
            <CardHeader>
              <CardTitle>Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productId" className="mb-2">
                  Select Package <span className="text-red-500">*</span>
                </Label>
                <select
                  id="productId"
                  name="productId"
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Choose a package...</option>
                  {packageProducts.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — BTN {parseFloat(p.unitPrice).toFixed(2)} ({p.billingCycle?.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                {packageProducts.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No service products with recurring billing found.{' '}
                    <Link href="/products/new" className="text-amber-800 hover:underline">
                      Create one first
                    </Link>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingCycle" className="mb-2">
                    Billing Cycle <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="billingCycle"
                    name="billingCycle"
                    required
                    defaultValue={selectedProduct?.billingCycle || 'monthly'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half Yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="price" className="mb-2">
                    Price per Cycle <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={selectedProduct ? parseFloat(selectedProduct.unitPrice).toFixed(2) : ''}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="startDate" className="mb-2">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoInvoiceToggle" className="cursor-pointer font-medium">
                    Auto-generate Invoices
                  </Label>
                  <p className="text-sm text-gray-500">
                    Automatically create invoices when billing is due
                  </p>
                </div>
                <Switch
                  id="autoInvoiceToggle"
                  checked={autoInvoice}
                  onCheckedChange={setAutoInvoice}
                />
              </div>
              <input type="hidden" name="autoInvoice" value={String(autoInvoice)} />

              <div>
                <Label htmlFor="notes" className="mb-2">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Optional notes about this subscription..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link href="/subscriptions">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isPending} className="bg-amber-500 hover:bg-amber-800">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Subscription'
              )}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
