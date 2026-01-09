'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Plus, Eye, Trash2 } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { deleteGstReturn } from '@/lib/gst/actions';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface GstReturn {
  id: number;
  returnNumber: string;
  periodStart: string;
  periodEnd: string;
  returnType: string;
  status: string;
  outputGst: string;
  inputGst: string;
  netGstPayable: string;
  totalPayable: string;
  filingDate: string | null;
  dueDate: string;
}

export default function FiledReturnsPage() {
  const { data: returns, isLoading } = useSWR<GstReturn[]>('/api/gst/returns', fetcher);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this draft return?')) {
      return;
    }

    setDeletingId(id);
    const result = await deleteGstReturn(id);

    if (result.error) {
      alert(result.error);
    } else {
      mutate('/api/gst/returns');
    }
    setDeletingId(null);
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">GST Returns</h1>
          <p className="text-muted-foreground">
            View and manage your GST return filings
          </p>
        </div>
        <Link href="/gst/prepare">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Prepare New Return
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            All Returns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading returns...
            </div>
          ) : !returns || returns.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No GST returns found</p>
              <Link href="/gst/prepare">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Return
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Return Number</th>
                    <th className="text-left p-3">Period</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-right p-3">Output GST</th>
                    <th className="text-right p-3">Input GST</th>
                    <th className="text-right p-3">Net Payable</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Due Date</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((gstReturn) => (
                    <tr key={gstReturn.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{gstReturn.returnNumber}</td>
                      <td className="p-3 text-sm">
                        {new Date(gstReturn.periodStart).toLocaleDateString()} -{' '}
                        {new Date(gstReturn.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className="capitalize text-sm">{gstReturn.returnType}</span>
                      </td>
                      <td className="p-3 text-right text-green-600">
                        {formatCurrency(gstReturn.outputGst, 'BTN')}
                      </td>
                      <td className="p-3 text-right text-blue-600">
                        {formatCurrency(gstReturn.inputGst, 'BTN')}
                      </td>
                      <td className="p-3 text-right font-semibold text-orange-600">
                        {formatCurrency(gstReturn.netGstPayable, 'BTN')}
                      </td>
                      <td className="p-3">{getStatusBadge(gstReturn.status)}</td>
                      <td className="p-3 text-sm">
                        {new Date(gstReturn.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-center">
                          <Link href={`/gst/filed-returns/${gstReturn.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {gstReturn.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(gstReturn.id)}
                              disabled={deletingId === gstReturn.id}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {returns && returns.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 text-sm">Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-blue-600">Total Returns</p>
                <p className="text-2xl font-bold">{returns.length}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Draft Returns</p>
                <p className="text-2xl font-bold">
                  {returns.filter((r) => r.status === 'draft').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Filed Returns</p>
                <p className="text-2xl font-bold">
                  {returns.filter((r) => r.status === 'filed' || r.status === 'approved').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Total GST Payable</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    returns
                      .filter((r) => r.status === 'filed' || r.status === 'approved')
                      .reduce((sum, r) => sum + parseFloat(r.totalPayable || '0'), 0)
                      .toFixed(2),
                    'BTN'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
