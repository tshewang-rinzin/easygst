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
import { Trash2, Download, ToggleLeft, ToggleRight } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
              This will add: mBoB, mPay, ePay, DK Mobile Bank, Bank Transfer, Cash, Cheque, and Online Payment
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      {hasAnyMethods && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {methods.filter(m => m.isEnabled).length} of {methods.length} payment methods enabled
            </p>
          </div>

          <div className="space-y-3">
            {methods.map((method) => (
              <Card key={method.id} className={!method.isEnabled ? 'opacity-60' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{method.name}</h3>
                        <Badge variant={method.isEnabled ? 'default' : 'secondary'}>
                          {method.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Code: {method.code}</p>
                      {method.description && (
                        <p className="text-sm text-gray-600 mt-2">{method.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
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
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{method.name}"? This action cannot be undone.
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Help Text */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">💡 Payment Methods Help</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Toggle payment methods on/off to control which appear when recording payments</li>
                  <li>Disabled methods are hidden from payment recording forms</li>
                  <li>Delete methods you don't need for your business</li>
                  <li>All enabled methods will be available when recording invoice payments</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
