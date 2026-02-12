import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, FileText } from 'lucide-react';
import { getDebitNoteWithDetails } from '@/lib/debit-notes/queries';
import { IssueDebitNoteButton } from '@/components/debit-notes/issue-debit-note-button';
import { DeleteDebitNoteButton } from '@/components/debit-notes/delete-debit-note-button';
import { ApplyDebitNoteDialog } from '@/components/debit-notes/apply-debit-note-dialog';

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
    issued: { label: 'Issued', className: 'bg-blue-100 text-blue-700' },
    partial: { label: 'Partially Applied', className: 'bg-yellow-100 text-yellow-700' },
    applied: { label: 'Fully Applied', className: 'bg-green-100 text-green-700' },
    refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
  };

  const config = statusConfig[status] || statusConfig.draft;
  return <Badge className={config.className}>{config.label}</Badge>;
}

async function DebitNoteDetails({ id }: { id: string }) {
  const debitNote = await getDebitNoteWithDetails(id);

  if (!debitNote) {
    notFound();
  }

  const isDraft = debitNote.status === 'draft';
  const isIssued = debitNote.status === 'issued';
  const hasUnappliedBalance = parseFloat(debitNote.unappliedAmount) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <FileText className="h-6 w-6" />
                {debitNote.debitNoteNumber}
                {getStatusBadge(debitNote.status)}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Created on {new Date(debitNote.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {isDraft && (
                <>
                  <Link href={`/purchases/debit-notes/${id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <IssueDebitNoteButton
                    debitNoteId={id}
                    debitNoteNumber={debitNote.debitNoteNumber}
                  />
                  <DeleteDebitNoteButton
                    debitNoteId={id}
                    debitNoteNumber={debitNote.debitNoteNumber}
                  />
                </>
              )}
              {(isIssued || debitNote.status === 'partial') && hasUnappliedBalance && (
                <ApplyDebitNoteDialog
                  debitNoteId={id}
                  debitNoteNumber={debitNote.debitNoteNumber}
                  supplierId={debitNote.supplierId}
                  currency={debitNote.currency}
                  unappliedAmount={debitNote.unappliedAmount}
                />
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Supplier & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supplier Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Supplier Name</p>
              <p className="font-medium">{debitNote.supplier?.name || 'N/A'}</p>
            </div>
            {debitNote.supplier?.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{debitNote.supplier.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Debit Note Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {new Date(debitNote.debitNoteDate).toLocaleDateString()}
              </p>
            </div>
            {debitNote.originalBill && (
              <div>
                <p className="text-sm text-gray-500">Original Bill</p>
                <Link
                  href={`/purchases/bills/${debitNote.originalBill.id}`}
                  className="font-medium text-orange-600 hover:text-orange-700"
                >
                  {debitNote.originalBill.billNumber}
                </Link>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="font-medium">{debitNote.currency}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reason */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reason for Debit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{debitNote.reason}</p>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">
                    Description
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">
                    Qty
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">
                    Unit Price
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">
                    Tax
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {debitNote.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      <p className="font-medium">{item.description}</p>
                      {item.product && (
                        <p className="text-xs text-gray-500">{item.product.name}</p>
                      )}
                    </td>
                    <td className="text-right py-3">
                      {parseFloat(item.quantity)} {item.unit || ''}
                    </td>
                    <td className="text-right py-3">
                      {debitNote.currency} {parseFloat(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="text-right py-3">
                      {parseFloat(item.taxRate).toFixed(0)}%
                      <br />
                      <span className="text-sm text-gray-600">
                        {debitNote.currency} {parseFloat(item.taxAmount).toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right py-3 font-medium">
                      {debitNote.currency} {parseFloat(item.itemTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {debitNote.currency} {parseFloat(debitNote.subtotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tax:</span>
                <span className="font-medium">
                  {debitNote.currency} {parseFloat(debitNote.totalTax).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span className="text-red-600">
                  -{debitNote.currency} {parseFloat(debitNote.totalAmount).toFixed(2)}
                </span>
              </div>
              {parseFloat(debitNote.appliedAmount) > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Applied:</span>
                    <span>
                      {debitNote.currency} {parseFloat(debitNote.appliedAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Unapplied Balance:</span>
                    <span className="text-orange-600">
                      {debitNote.currency} {parseFloat(debitNote.unappliedAmount).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications */}
      {debitNote.applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applied To Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {debitNote.applications.map((application) => (
                <div
                  key={application.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <Link
                      href={`/purchases/bills/${application.bill?.id}`}
                      className="font-medium text-orange-600 hover:text-orange-700"
                    >
                      {application.bill?.billNumber || 'Unknown Bill'}
                    </Link>
                    <p className="text-sm text-gray-500">
                      Applied on {new Date(application.applicationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-medium text-green-600">
                    {debitNote.currency} {parseFloat(application.appliedAmount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {(debitNote.notes || debitNote.supplierNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {debitNote.supplierNotes && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Supplier Notes</p>
                <p className="text-sm">{debitNote.supplierNotes}</p>
              </div>
            )}
            {debitNote.notes && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Internal Notes</p>
                <p className="text-sm">{debitNote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default async function DebitNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/purchases/debit-notes"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Debit Notes
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="text-gray-500">Loading debit note...</p>
          </div>
        }
      >
        <DebitNoteDetails id={id} />
      </Suspense>
    </section>
  );
}
