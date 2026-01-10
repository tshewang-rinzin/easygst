'use client';

import { use, useState, useActionState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, FileSpreadsheet, Check, Edit } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { fileGstReturn, amendGstReturn } from '@/lib/gst/actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function GstReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: gstReturn, isLoading } = useSWR(`/api/gst/returns/${id}`, fetcher);

  const [isFilingMode, setIsFilingMode] = useState(false);
  const [isAmendMode, setIsAmendMode] = useState(false);
  const [filingDate, setFilingDate] = useState<Date>(new Date());

  const [fileState, fileAction, isFilingPending] = useActionState(fileGstReturn, { error: '' } as any);
  const [amendState, amendAction, isAmendPending] = useActionState(amendGstReturn, { error: '' } as any);

  // Auto-navigate on success
  useEffect(() => {
    if (('success' in fileState && fileState.success) || ('success' in amendState && amendState.success)) {
      router.push('/gst/filed-returns');
    }
  }, [fileState, amendState, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12 text-muted-foreground">
          Loading return details...
        </div>
      </div>
    );
  }

  if (!gstReturn) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12 text-muted-foreground">
          GST return not found
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100">Draft</Badge>;
      case 'filed':
        return <Badge className="bg-blue-500">Filed</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'amended':
        return <Badge className="bg-yellow-500">Amended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/gst/filed-returns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{gstReturn.returnNumber}</h1>
              {getStatusBadge(gstReturn.status)}
            </div>
            <p className="text-muted-foreground">GST Return Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {gstReturn.status === 'draft' && !isFilingMode && (
            <Button onClick={() => setIsFilingMode(true)}>
              <Check className="mr-2 h-4 w-4" />
              File Return
            </Button>
          )}
          {gstReturn.status === 'filed' && !isAmendMode && (
            <Button variant="outline" onClick={() => setIsAmendMode(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Amend Return
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Return Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Return Number</div>
              <div className="font-medium">{gstReturn.returnNumber}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Period</div>
              <div className="font-medium">
                {new Date(gstReturn.periodStart).toLocaleDateString()} - {new Date(gstReturn.periodEnd).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Return Type</div>
              <div className="font-medium capitalize">{gstReturn.returnType}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Due Date</div>
              <div className="font-medium">{new Date(gstReturn.dueDate).toLocaleDateString()}</div>
            </div>
            {gstReturn.filingDate && (
              <div>
                <div className="text-sm text-muted-foreground">Filed On</div>
                <div className="font-medium">{new Date(gstReturn.filingDate).toLocaleDateString()}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GST Amounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Output GST</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(gstReturn.outputGst, 'BTN')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Input GST</div>
              <div className="text-xl font-bold text-blue-600">
                {formatCurrency(gstReturn.inputGst, 'BTN')}
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground">Net GST Payable</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(gstReturn.netGstPayable, 'BTN')}
              </div>
            </div>
            {gstReturn.totalPayable !== gstReturn.netGstPayable && (
              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground">Total Payable (with adjustments)</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(gstReturn.totalPayable, 'BTN')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {gstReturn.salesBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Classification</th>
                    <th className="text-right p-2">Sales</th>
                    <th className="text-right p-2">GST</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">Standard-Rated (5%)</td>
                    <td className="p-2 text-right">{formatCurrency(gstReturn.salesBreakdown.standard?.sales || '0', 'BTN')}</td>
                    <td className="p-2 text-right">{formatCurrency(gstReturn.salesBreakdown.standard?.gst || '0', 'BTN')}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Zero-Rated (0%)</td>
                    <td className="p-2 text-right">{formatCurrency(gstReturn.salesBreakdown.zeroRated?.sales || '0', 'BTN')}</td>
                    <td className="p-2 text-right">{formatCurrency(gstReturn.salesBreakdown.zeroRated?.gst || '0', 'BTN')}</td>
                  </tr>
                  <tr>
                    <td className="p-2">Exempt</td>
                    <td className="p-2 text-right">{formatCurrency(gstReturn.salesBreakdown.exempt?.sales || '0', 'BTN')}</td>
                    <td className="p-2 text-right">{formatCurrency(gstReturn.salesBreakdown.exempt?.gst || '0', 'BTN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {isFilingMode && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-900">File GST Return</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={fileAction} className="space-y-6">
              <input type="hidden" name="returnId" value={id} />

              {fileState.error && (
                <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
                  {fileState.error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Filing Date *</Label>
                  <DatePicker date={filingDate} onDateChange={(date) => setFilingDate(date || new Date())} />
                  <input type="hidden" name="filingDate" value={filingDate?.toISOString()} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adjustments">Adjustments</Label>
                  <Input
                    id="adjustments"
                    name="adjustments"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="previousPeriodBalance">Previous Period Balance</Label>
                  <Input
                    id="previousPeriodBalance"
                    name="previousPeriodBalance"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penalties">Penalties</Label>
                  <Input
                    id="penalties"
                    name="penalties"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest">Interest</Label>
                  <Input
                    id="interest"
                    name="interest"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Add any notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsFilingMode(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isFilingPending}>
                  {isFilingPending ? 'Filing...' : 'File Return'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isAmendMode && (
        <Card className="border-2 border-yellow-500">
          <CardHeader>
            <CardTitle className="text-yellow-900">Amend GST Return</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={amendAction} className="space-y-6">
              <input type="hidden" name="returnId" value={id} />

              {amendState.error && (
                <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
                  {amendState.error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adjustments">New Adjustment Amount *</Label>
                <Input
                  id="adjustments"
                  name="adjustments"
                  type="number"
                  step="0.01"
                  defaultValue={gstReturn.adjustments || '0'}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Amendment *</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Explain why this return is being amended..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsAmendMode(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAmendPending}>
                  {isAmendPending ? 'Amending...' : 'Amend Return'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
