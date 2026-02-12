import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye } from 'lucide-react';
import { getCreditNotes } from '@/lib/credit-notes/queries';

function CreditNotesSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-48" />
              </div>
              <div className="h-8 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
    issued: { label: 'Issued', className: 'bg-blue-100 text-blue-700' },
    partial: { label: 'Partially Applied', className: 'bg-yellow-100 text-yellow-700' },
    applied: { label: 'Applied', className: 'bg-green-100 text-green-700' },
    refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  };

  const config = statusConfig[status] || statusConfig.draft;
  return <Badge className={config.className}>{config.label}</Badge>;
}

async function CreditNotesList() {
  const creditNotes = await getCreditNotes();

  if (creditNotes.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No credit notes yet</h3>
          <p className="text-gray-500 mb-4">
            Credit notes are used to refund or adjust invoices for customers.
          </p>
          <Link href="/sales/credit-notes/new">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Credit Note
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Note
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unapplied
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {creditNotes.map(({ creditNote, customer, invoice }) => (
                <tr key={creditNote.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{creditNote.creditNoteNumber}</p>
                      {invoice && (
                        <p className="text-xs text-gray-500">Ref: {invoice.invoiceNumber}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-gray-900">{customer?.name || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(creditNote.creditNoteDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="font-medium text-gray-900">
                      {creditNote.currency} {parseFloat(creditNote.totalAmount).toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className={parseFloat(creditNote.unappliedAmount) > 0 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                      {creditNote.currency} {parseFloat(creditNote.unappliedAmount).toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(creditNote.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link href={`/sales/credit-notes/${creditNote.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CreditNotesPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">Credit Notes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage refunds and adjustments for customers
          </p>
        </div>
        <Link href="/sales/credit-notes/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            New Credit Note
          </Button>
        </Link>
      </div>

      <Suspense fallback={<CreditNotesSkeleton />}>
        <CreditNotesList />
      </Suspense>
    </section>
  );
}
