'use client';

import { useState, useActionState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Lock, Plus, Trash2, AlertCircle } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { createPeriodLock, removePeriodLock } from '@/lib/gst/actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PeriodLock {
  id: number;
  periodStart: string;
  periodEnd: string;
  periodType: string;
  lockedAt: string;
  reason: string | null;
}

export default function PeriodLockPage() {
  const { data: locks, isLoading } = useSWR<PeriodLock[]>('/api/gst/period-locks', fetcher);
  const [isAddingLock, setIsAddingLock] = useState(false);
  const [periodStart, setPeriodStart] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [periodEnd, setPeriodEnd] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [periodType, setPeriodType] = useState<string>('monthly');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [state, formAction, isPending] = useActionState(createPeriodLock, { error: '' } as any);

  // Auto-close form on success
  useEffect(() => {
    if ('success' in state && state.success) {
      setIsAddingLock(false);
      mutate('/api/gst/period-locks');
    }
  }, [state]);

  const handleRemoveLock = async (id: number) => {
    if (!confirm('Are you sure you want to remove this period lock? This will allow modifications to the period.')) {
      return;
    }

    setDeletingId(id);
    const result = await removePeriodLock(id);

    if (result.error) {
      alert(result.error);
    } else {
      mutate('/api/gst/period-locks');
    }
    setDeletingId(null);
  };

  const handlePeriodTypeChange = (type: string) => {
    setPeriodType(type);

    if (type === 'monthly') {
      const endDate = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
      setPeriodEnd(endDate);
    } else if (type === 'quarterly') {
      const quarter = Math.floor(periodStart.getMonth() / 3);
      const endDate = new Date(periodStart.getFullYear(), (quarter + 1) * 3, 0);
      setPeriodEnd(endDate);
    } else if (type === 'annual') {
      const endDate = new Date(periodStart.getFullYear() + 1, periodStart.getMonth(), 0);
      setPeriodEnd(endDate);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">GST Period Locks</h1>
          <p className="text-muted-foreground">
            Lock accounting periods to prevent modifications after GST filing
          </p>
        </div>
        {!isAddingLock && (
          <Button onClick={() => setIsAddingLock(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Period Lock
          </Button>
        )}
      </div>

      {isAddingLock && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Lock className="h-5 w-5" />
              Create New Period Lock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-6">
              {state.error && (
                <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>{state.error}</div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="periodType">Period Type *</Label>
                <select
                  id="periodType"
                  name="periodType"
                  value={periodType}
                  onChange={(e) => handlePeriodTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Period Start *</Label>
                  <DatePicker date={periodStart} onDateChange={(date) => setPeriodStart(date || new Date())} />
                  <input
                    type="hidden"
                    name="periodStart"
                    value={periodStart?.toISOString()}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Period End *</Label>
                  <DatePicker date={periodEnd} onDateChange={(date) => setPeriodEnd(date || new Date())} />
                  <input
                    type="hidden"
                    name="periodEnd"
                    value={periodEnd?.toISOString()}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Explain why this period is being locked..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingLock(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Lock'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Locked Periods
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading period locks...
            </div>
          ) : !locks || locks.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No period locks found</p>
              <p className="text-sm text-gray-500 mb-4">
                Period locks are automatically created when you file a GST return
              </p>
              {!isAddingLock && (
                <Button onClick={() => setIsAddingLock(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Manual Lock
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Period Start</th>
                    <th className="text-left p-3">Period End</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Locked On</th>
                    <th className="text-left p-3">Reason</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locks.map((lock) => (
                    <tr key={lock.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        {new Date(lock.periodStart).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {new Date(lock.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className="capitalize text-sm">{lock.periodType}</span>
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(lock.lockedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm">
                        {lock.reason || 'No reason provided'}
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLock(lock.id)}
                          disabled={deletingId === lock.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-900 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            About Period Locks
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-yellow-900">
          <p>
            <strong>What are period locks?</strong> Period locks prevent any modifications to transactions
            within a specific accounting period.
          </p>
          <p>
            <strong>When are they created?</strong> Locks are automatically created when you file a GST
            return to ensure data integrity.
          </p>
          <p>
            <strong>What happens when locked?</strong> No invoices, bills, payments, or adjustments can be
            created, edited, or deleted for the locked period.
          </p>
          <p>
            <strong>Can they be removed?</strong> Yes, but only by authorized users. Removing a lock should
            be done carefully as it may affect filed GST returns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
