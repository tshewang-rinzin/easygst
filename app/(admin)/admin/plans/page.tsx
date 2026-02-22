'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Crown, Package, Plus, Edit, Trash2, Check, X, Users, FileText, ShoppingBag, UserCheck, Sparkles, Zap } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Feature {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  maxUsers: number | null;
  maxInvoicesPerMonth: number | null;
  maxProducts: number | null;
  maxCustomers: number | null;
  monthlyPrice: string;
  yearlyPrice: string;
  sortOrder: number;
  teamCount: number;
  features: Feature[];
}

const moduleLabels: Record<string, string> = {
  sales: '🛒 Sales',
  purchases: '📦 Purchases',
  payments: '💳 Payments',
  inventory: '📦 Inventory',
  compliance: '📋 Compliance',
  communication: '📧 Communication',
  advanced: '⚡ Advanced',
};

const planIcons = [Crown, Package, Sparkles, Zap];

export default function PlansPage() {
  const { data: plans, isLoading: plansLoading } = useSWR<Plan[]>('/api/admin/plans', fetcher);
  const { data: allFeatures } = useSWR<Feature[]>('/api/admin/features', fetcher);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const handleSeed = async () => {
    setIsSeeding(true);
    await fetch('/api/admin/features/seed', { method: 'POST' });
    mutate('/api/admin/plans');
    mutate('/api/admin/features');
    setIsSeeding(false);
  };

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`Delete plan "${planName}"? Teams on this plan will be unassigned.`)) return;
    await fetch(`/api/admin/plans/${planId}`, { method: 'DELETE' });
    mutate('/api/admin/plans');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans & Features</h1>
          <p className="text-gray-500 mt-1">Manage subscription plans and feature assignments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSeed} disabled={isSeeding} variant="outline">
            {isSeeding ? 'Seeding...' : 'Seed Defaults'}
          </Button>
          <Button onClick={() => { setEditingPlan(null); setShowCreateDialog(true); }} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-40 bg-gray-100 rounded" /></CardContent></Card>
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, idx) => {
            const Icon = planIcons[idx % planIcons.length];
            return (
              <Card key={plan.id} className={plan.isDefault ? 'border-orange-300 bg-orange-50/30' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-orange-500" />
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingPlan(plan); setShowCreateDialog(true); }}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(plan.id, plan.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {plan.isDefault && <Badge className="bg-orange-100 text-orange-700 w-fit">Default</Badge>}
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing */}
                  <div>
                    <span className="text-2xl font-bold">BTN {parseFloat(plan.monthlyPrice || '0').toLocaleString()}</span>
                    <span className="text-gray-500 text-sm">/mo</span>
                  </div>

                  {/* Limits */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      <span>{plan.maxUsers ?? '∞'} users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      <span>{plan.maxInvoicesPerMonth ?? '∞'} invoices/mo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
                      <span>{plan.maxProducts ?? '∞'} products</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                      <span>{plan.maxCustomers ?? '∞'} customers</span>
                    </div>
                  </div>

                  {/* Features count */}
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-500">{plan.features.length} features enabled</span>
                    <span className="text-sm text-gray-400 ml-2">• {plan.teamCount} teams</span>
                  </div>

                  {/* Feature list */}
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {plan.features.map(f => (
                      <div key={f.id} className="flex items-center gap-1.5 text-xs">
                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                        <span className="text-gray-600">{f.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No plans configured yet</p>
            <Button onClick={handleSeed} className="bg-orange-500 hover:bg-orange-600">
              Seed Default Plans & Features
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All Features Reference */}
      {allFeatures && allFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Features</CardTitle>
            <CardDescription>Available features that can be assigned to plans</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(
              allFeatures.reduce<Record<string, Feature[]>>((acc, f) => {
                if (!acc[f.module]) acc[f.module] = [];
                acc[f.module].push(f);
                return acc;
              }, {})
            ).map(([mod, feats]) => (
              <div key={mod} className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">{moduleLabels[mod] || mod}</h4>
                <div className="flex flex-wrap gap-2">
                  {feats.map(f => (
                    <Badge key={f.id} variant="outline" className="text-xs">
                      {f.name}
                      <span className="ml-1 text-gray-400">({f.code})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Plan Dialog */}
      {showCreateDialog && (
        <PlanDialog
          plan={editingPlan}
          features={allFeatures || []}
          onClose={() => { setShowCreateDialog(false); setEditingPlan(null); }}
          onSaved={() => { setShowCreateDialog(false); setEditingPlan(null); mutate('/api/admin/plans'); }}
        />
      )}
    </div>
  );
}

function PlanDialog({ plan, features, onClose, onSaved }: {
  plan: Plan | null;
  features: Feature[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(plan?.name || '');
  const [description, setDescription] = useState(plan?.description || '');
  const [isDefault, setIsDefault] = useState(plan?.isDefault || false);
  const [maxUsers, setMaxUsers] = useState(plan?.maxUsers?.toString() || '');
  const [maxInvoices, setMaxInvoices] = useState(plan?.maxInvoicesPerMonth?.toString() || '');
  const [maxProducts, setMaxProducts] = useState(plan?.maxProducts?.toString() || '');
  const [maxCustomers, setMaxCustomers] = useState(plan?.maxCustomers?.toString() || '');
  const [monthlyPrice, setMonthlyPrice] = useState(plan?.monthlyPrice || '0');
  const [yearlyPrice, setYearlyPrice] = useState(plan?.yearlyPrice || '0');
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set(plan?.features.map(f => f.id) || [])
  );
  const [saving, setSaving] = useState(false);

  const toggleFeature = (id: string) => {
    const next = new Set(selectedFeatures);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedFeatures(next);
  };

  const selectAllInModule = (mod: string) => {
    const next = new Set(selectedFeatures);
    features.filter(f => f.module === mod).forEach(f => next.add(f.id));
    setSelectedFeatures(next);
  };

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);

    const body = {
      name,
      description,
      isDefault,
      maxUsers: maxUsers ? parseInt(maxUsers) : null,
      maxInvoicesPerMonth: maxInvoices ? parseInt(maxInvoices) : null,
      maxProducts: maxProducts ? parseInt(maxProducts) : null,
      maxCustomers: maxCustomers ? parseInt(maxCustomers) : null,
      monthlyPrice,
      yearlyPrice,
      featureIds: Array.from(selectedFeatures),
    };

    if (plan) {
      await fetch(`/api/admin/plans/${plan.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/admin/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }

    setSaving(false);
    onSaved();
  };

  const grouped = features.reduce<Record<string, Feature[]>>((acc, f) => {
    if (!acc[f.module]) acc[f.module] = [];
    acc[f.module].push(f);
    return acc;
  }, {});

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
          <DialogDescription>Configure plan details, limits, and feature access</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Plan Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Professional" />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="h-4 w-4" />
                <span className="text-sm">Default plan for new teams</span>
              </label>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monthly Price (BTN)</Label>
              <Input type="number" value={monthlyPrice} onChange={e => setMonthlyPrice(e.target.value)} />
            </div>
            <div>
              <Label>Yearly Price (BTN)</Label>
              <Input type="number" value={yearlyPrice} onChange={e => setYearlyPrice(e.target.value)} />
            </div>
          </div>

          {/* Limits */}
          <div>
            <Label className="text-base font-semibold">Limits</Label>
            <p className="text-xs text-gray-500 mb-2">Leave empty for unlimited</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Max Users</Label>
                <Input type="number" value={maxUsers} onChange={e => setMaxUsers(e.target.value)} placeholder="∞" />
              </div>
              <div>
                <Label className="text-xs">Invoices/Month</Label>
                <Input type="number" value={maxInvoices} onChange={e => setMaxInvoices(e.target.value)} placeholder="∞" />
              </div>
              <div>
                <Label className="text-xs">Max Products</Label>
                <Input type="number" value={maxProducts} onChange={e => setMaxProducts(e.target.value)} placeholder="∞" />
              </div>
              <div>
                <Label className="text-xs">Max Customers</Label>
                <Input type="number" value={maxCustomers} onChange={e => setMaxCustomers(e.target.value)} placeholder="∞" />
              </div>
            </div>
          </div>

          {/* Feature Selection */}
          <div>
            <Label className="text-base font-semibold">Features</Label>
            <p className="text-xs text-gray-500 mb-3">{selectedFeatures.size} selected</p>
            <div className="space-y-4">
              {Object.entries(grouped).map(([mod, feats]) => (
                <div key={mod} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{moduleLabels[mod] || mod}</span>
                    <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => selectAllInModule(mod)}>
                      Select all
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {feats.map(f => (
                      <label key={f.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedFeatures.has(f.id)}
                          onChange={() => toggleFeature(f.id)}
                          className="h-3.5 w-3.5"
                        />
                        <span>{f.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name} className="bg-orange-500 hover:bg-orange-600">
            {saving ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
