'use client';

import { useState, useActionState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { FileSpreadsheet, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createGstReturn } from '@/lib/gst/actions';

export default function PrepareGstReturnPage() {
  const router = useRouter();
  const [periodStart, setPeriodStart] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [periodEnd, setPeriodEnd] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [returnType, setReturnType] = useState<string>('monthly');

  const [state, formAction, isPending] = useActionState(createGstReturn, { error: '' } as any);

  // Auto-navigate on success
  useEffect(() => {
    if ('success' in state && state.success && 'returnId' in state && state.returnId) {
      router.push(`/gst/filed-returns`);
    }
  }, [state, router]);

  // Update period end when start or type changes
  const handlePeriodStartChange = (date: Date | undefined) => {
    if (!date) return;
    setPeriodStart(date);

    if (returnType === 'monthly') {
      // Last day of the month
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      setPeriodEnd(endDate);
    } else if (returnType === 'quarterly') {
      // Last day of the quarter
      const quarter = Math.floor(date.getMonth() / 3);
      const endDate = new Date(date.getFullYear(), (quarter + 1) * 3, 0);
      setPeriodEnd(endDate);
    } else if (returnType === 'annual') {
      // Last day of fiscal year
      const endDate = new Date(date.getFullYear() + 1, date.getMonth(), 0);
      setPeriodEnd(endDate);
    }
  };

  const handleReturnTypeChange = (type: string) => {
    setReturnType(type);

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
      <div className="flex items-center gap-4">
        <Link href="/gst/summary">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Prepare GST Return</h1>
          <p className="text-muted-foreground">
            Create a new GST return for the selected period
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form action={formAction}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Return Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {state.error && (
                  <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div>{state.error}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="returnType">Return Type *</Label>
                  <select
                    id="returnType"
                    name="returnType"
                    value={returnType}
                    onChange={(e) => handleReturnTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    {returnType === 'monthly' && 'File GST return for a calendar month'}
                    {returnType === 'quarterly' && 'File GST return for a 3-month quarter'}
                    {returnType === 'annual' && 'File GST return for a fiscal year'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Period Start *</Label>
                    <DatePicker date={periodStart} onDateChange={handlePeriodStartChange} />
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
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add any notes or comments about this return..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Link href="/gst/summary">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Draft Return'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="space-y-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 text-sm">What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3 text-blue-900">
              <div className="flex gap-2">
                <div className="font-bold">1.</div>
                <div>System calculates GST for the selected period</div>
              </div>
              <div className="flex gap-2">
                <div className="font-bold">2.</div>
                <div>Draft return is created with auto-calculated amounts</div>
              </div>
              <div className="flex gap-2">
                <div className="font-bold">3.</div>
                <div>You can review and make adjustments if needed</div>
              </div>
              <div className="flex gap-2">
                <div className="font-bold">4.</div>
                <div>File the return when ready</div>
              </div>
              <div className="flex gap-2">
                <div className="font-bold">5.</div>
                <div>Period gets automatically locked after filing</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-900 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-yellow-900">
              <p>• Ensure all invoices and bills for the period are recorded</p>
              <p>• Only paid invoices are included in Output GST</p>
              <p>• All supplier bills in the period contribute to Input GST</p>
              <p>• Period will be locked after filing the return</p>
              <p>• You can amend a filed return if needed</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
