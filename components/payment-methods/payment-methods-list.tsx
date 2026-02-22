'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  deletePaymentMethod,
  togglePaymentMethod,
  seedDefaultPaymentMethods,
} from '@/lib/payment-methods/actions';
import type { PaymentMethod } from '@/lib/db/schema';
import {
  Trash2,
  Download,
  ToggleLeft,
  ToggleRight,
  Banknote,
  Smartphone,
  Building2,
  FileCheck,
  Globe,
  MoreHorizontal,
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  cash: { label: 'Cash', icon: Banknote, color: 'bg-green-50 border-green-200' },
  mobile_banking: { label: 'Mobile Banking', icon: Smartphone, color: 'bg-blue-50 border-blue-200' },
  bank_transfer: { label: 'Bank Transfer', icon: Building2, color: 'bg-purple-50 border-purple-200' },
  cheque: { label: 'Cheque', icon: FileCheck, color: 'bg-yellow-50 border-yellow-200' },
  online: { label: 'Online', icon: Globe, color: 'bg-orange-50 border-orange-200' },
  other: { label: 'Other', icon: MoreHorizontal, color: 'bg-gray-50 border-gray-200' },
};

const CATEGORY_ORDER = ['cash', 'mobile_banking', 'bank_transfer', 'cheque', 'online', 'other'];

interface PaymentMethodsListProps {
  initialMethods: PaymentMethod[];
  hasAnyMethods: boolean;
}

export function PaymentMethodsList({ initialMethods, hasAnyMethods: initialHasAny }: PaymentMethodsListProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const { data: methods, mutate } = useSWR<PaymentMethod[]>(
    '/api/payment-methods',
    fetcher,
    { fallbackData: initialMethods }
  );

  const hasAnyMethods = methods && methods.length > 0;

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('isEnabled', (!currentStatus).toString());
    const result = await togglePaymentMethod(formData);
    if ('success' in result && result.success) {
      mutate();
    } else if ('error' in result && result.error) {
      alert(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    const formData = new FormData();
    formData.append('id', id.toString());
    const result = await deletePaymentMethod(formData);
    if ('success' in result && result.success) {
      mutate();
    } else if ('error' in result && result.error) {
      alert(result.error);
    }
  };

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    const result = await seedDefaultPaymentMethods();
    if ('success' in result && result.success) {
      mutate();
    } else if ('error' in result && result.error) {
      alert(result.error);
    }
    setIsSeeding(false);
  };

  // Group methods by category
  const grouped: Record<string, PaymentMethod[]> = {};
  if (methods) {
    for (const m of methods) {
      const cat = (m as any).category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(m);
    }
  }

  const enabledCount = methods?.filter(m => m.isEnabled).length || 0;
  const totalCount = methods?.length || 0;

  return (
    <div className="space-y-6">
      {/* Seed Default Methods Button */}
      {!hasAnyMethods && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg">No Payment Methods Found</CardTitle>
            <CardDescription>
              Get started by adding default Bhutan payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSeeding ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-spin" />
                  Adding Default Methods...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Add Default Payment Methods
                </>
              )}
            </Button>
            <p className="text-xs text-gray-600 mt-3">
              This will add: mBoB, mPay, ePay, DK Mobile Bank, tPay, DrukPay, Bank Transfer, Cash, Cheque, and Online Payment
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List - Grouped */}
      {hasAnyMethods && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {enabledCount} of {totalCount} payment methods enabled
            </p>
          </div>

          {CATEGORY_ORDER.map((catKey) => {
            const catMethods = grouped[catKey];
            if (!catMethods || catMethods.length === 0) return null;

            const config = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.other;
            const Icon = config.icon;

            return (
              <Card key={catKey} className={config.color}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-base">{config.label}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {catMethods.filter(m => m.isEnabled).length}/{catMethods.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {catMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`flex items-center justify-between p-3 bg-white rounded-lg border ${
                          !method.isEnabled ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm">{method.name}</span>
                            <Badge
                              variant={method.isEnabled ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {method.isEnabled ? 'On' : 'Off'}
                            </Badge>
                          </div>
                          {method.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleToggle(method.id, method.isEnabled)}
                            title={method.isEnabled ? 'Disable' : 'Enable'}
                          >
                            {method.isEnabled ? (
                              <ToggleRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-gray-400" />
                            )}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{method.name}"? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(method.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
