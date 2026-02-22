'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Crown, Sparkles, AlertCircle, CreditCard, Calendar, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
interface PlanData {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  monthlyPrice: string | null;
  yearlyPrice: string | null;
  maxUsers: number | null;
  maxInvoicesPerMonth: number | null;
  maxProducts: number | null;
  maxCustomers: number | null;
  planFeatures: { feature: { id: string; code: string; name: string; module: string } }[];
  [key: string]: any;
}

interface SubscriptionData {
  id: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  [key: string]: any;
}

interface PaymentData {
  id: string;
  amount: string;
  status: string;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: Date;
  [key: string]: any;
}

interface SubscriptionClientProps {
  team: { id: string; name: string };
  plans: PlanData[];
  currentPlan: { id: string; sortOrder: number; [key: string]: any } | null;
  subscription: SubscriptionData | null;
  payments: PaymentData[];
}

export function SubscriptionClient({
  team,
  plans,
  currentPlan,
  subscription,
  payments,
}: SubscriptionClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const cancelled = searchParams.get('cancelled');

  const sortedPlans = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle }),
      });

      const data = await res.json();
      if (data.paymentUrl) {
        // In real integration, redirect to payment gateway
        // For now, simulate success by going to callback directly
        window.location.href = data.paymentUrl;
      } else {
        alert(data.error || 'Failed to initiate checkout');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        setCancelDialogOpen(false);
        router.refresh();
      } else {
        alert(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  const getPrice = (plan: PlanData) => {
    const price = billingCycle === 'monthly'
      ? parseFloat(plan.monthlyPrice || '0')
      : parseFloat(plan.yearlyPrice || '0');
    return price;
  };

  const getMonthlyEquivalent = (plan: PlanData) => {
    if (billingCycle === 'yearly') {
      return parseFloat(plan.yearlyPrice || '0') / 12;
    }
    return parseFloat(plan.monthlyPrice || '0');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isCurrentPlan = (plan: PlanData) => currentPlan?.id === plan.id;
  const isFree = (plan: PlanData) => getPrice(plan) === 0;

  const getPlanAction = (plan: PlanData) => {
    if (isCurrentPlan(plan)) return 'current';
    if (isFree(plan)) return 'downgrade';
    if (!currentPlan) return 'upgrade';
    const currentSort = currentPlan.sortOrder;
    return plan.sortOrder > currentSort ? 'upgrade' : 'downgrade';
  };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">Subscription</h1>
        <p className="text-sm text-gray-500">
          Manage your plan and billing for {team.name}
        </p>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">Your subscription has been activated successfully!</p>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">
            {error === 'payment_failed' ? 'Payment was not successful. Please try again.' :
             error === 'payment_not_found' ? 'Payment record not found.' :
             'Something went wrong. Please try again.'}
          </p>
        </div>
      )}
      {cancelled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">Payment was cancelled. No charges were made.</p>
        </div>
      )}

      {/* Current Subscription Info */}
      {subscription && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Current Subscription</CardTitle>
                <CardDescription>
                  {currentPlan?.name} Plan — {subscription.billingCycle}
                </CardDescription>
              </div>
              <Badge
                variant={subscription.status === 'active' ? 'default' : 'secondary'}
                className={subscription.status === 'active' ? 'bg-green-100 text-green-800' : subscription.status === 'cancelled' ? 'bg-yellow-100 text-yellow-800' : ''}
              >
                {subscription.status === 'active' ? 'Active' :
                 subscription.status === 'cancelled' ? 'Cancelled (active until period end)' :
                 subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Billing Cycle</p>
                <p className="font-medium capitalize">{subscription.billingCycle}</p>
              </div>
              <div>
                <p className="text-gray-500">Current Period</p>
                <p className="font-medium">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} — {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Next Billing Date</p>
                <p className="font-medium">
                  {subscription.status === 'cancelled'
                    ? 'N/A (cancelled)'
                    : new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  }
                </p>
              </div>
            </div>
            {subscription.status === 'active' && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Cancel Subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 flex items-center gap-1">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
            <Badge className="ml-2 bg-orange-100 text-orange-700 text-xs">Save ~17%</Badge>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {sortedPlans.map((plan) => {
          const action = getPlanAction(plan);
          const price = getPrice(plan);
          const monthlyEq = getMonthlyEquivalent(plan);
          const isRecommended = plan.name === 'Professional';

          return (
            <Card
              key={plan.id}
              className={`relative ${
                isRecommended ? 'border-orange-500 border-2 shadow-lg' : ''
              } ${isCurrentPlan(plan) ? 'bg-orange-50/50' : ''}`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}
              {isCurrentPlan(plan) && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white">Current Plan</Badge>
                </div>
              )}

              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {plan.name}
                  {plan.name === 'Enterprise' && <Crown className="h-4 w-4 text-orange-500" />}
                </CardTitle>
                <CardDescription className="text-xs">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                {/* Price */}
                <div className="mb-4">
                  {price === 0 ? (
                    <div className="text-3xl font-bold text-gray-900">Free</div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          BTN {formatCurrency(monthlyEq)}
                        </span>
                        <span className="text-sm text-gray-500">/mo</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <p className="text-xs text-gray-500 mt-1">
                          BTN {formatCurrency(price)} billed yearly
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Limits */}
                <div className="space-y-2 mb-4 text-sm">
                  {plan.maxUsers && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>{plan.maxUsers} team members</span>
                    </div>
                  )}
                  {plan.maxInvoicesPerMonth && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>{plan.maxInvoicesPerMonth} invoices/month</span>
                    </div>
                  )}
                  {plan.maxProducts && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>{plan.maxProducts} products</span>
                    </div>
                  )}
                  {plan.maxCustomers && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>{plan.maxCustomers} customers</span>
                    </div>
                  )}
                  {!plan.maxUsers && !plan.maxInvoicesPerMonth && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>Unlimited everything</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-1.5 mb-6 text-xs text-gray-600 border-t pt-3">
                  {plan.planFeatures.slice(0, 5).map((pf) => (
                    <div key={pf.feature.id} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500 shrink-0" />
                      <span>{pf.feature.name}</span>
                    </div>
                  ))}
                  {plan.planFeatures.length > 5 && (
                    <p className="text-gray-400 pl-5">
                      +{plan.planFeatures.length - 5} more features
                    </p>
                  )}
                </div>

                {/* Action Button */}
                {action === 'current' ? (
                  <Button disabled className="w-full" variant="outline">
                    Current Plan
                  </Button>
                ) : action === 'upgrade' ? (
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? 'Processing...' : 'Upgrade'}
                  </Button>
                ) : isFree(plan) ? (
                  <Button variant="outline" className="w-full" disabled>
                    Free Plan
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? 'Processing...' : 'Switch Plan'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Method</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4 font-medium">
                        BTN {parseFloat(payment.amount).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 capitalize">
                        {(payment.paymentMethod || 'N/A').replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant="secondary"
                          className={
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                            ''
                          }
                        >
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-500 font-mono text-xs">
                        {payment.transactionId || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? Your plan will remain active
              until the end of the current billing period
              {subscription && (
                <span className="font-medium">
                  {' '}({new Date(subscription.currentPeriodEnd).toLocaleDateString()})
                </span>
              )}.
              After that, your team will be downgraded to the Free plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelLoading}
            >
              {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
