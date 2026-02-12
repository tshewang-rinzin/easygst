import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, FileText, Send, Trash2 } from 'lucide-react';
import { getCreditNoteWithDetails } from '@/lib/credit-notes/queries';
import { IssueCreditNoteButton } from '@/components/credit-notes/issue-credit-note-button';
import { DeleteCreditNoteButton } from '@/components/credit-notes/delete-credit-note-button';
import { ApplyCreditNoteDialog } from '@/components/credit-notes/apply-credit-note-dialog';

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

async function CreditNoteDetails({ id }: { id: string }) {
  const creditNote = await getCreditNoteWithDetails(id);

  if (!creditNote) {
    notFound();
  }

  const isDraft = creditNote.status === 'draft';
  const isIssued = creditNote.status === 'issued';
  const hasUnappliedBalance = parseFloat(creditNote.unappliedAmount) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <FileText className="h-6 w-6" />
                {creditNote.creditNoteNumber}
                {getStatusBadge(creditNote.status)}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Created on {new Date(creditNote.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {isDraft && (
                <>
                  <Link href={`/sales/credit-notes/${id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <IssueCreditNoteButton
                    creditNoteId={id}
                    creditNoteNumber={creditNote.creditNoteNumber}
                  />
                  <DeleteCreditNoteButton
                    creditNoteId={id}
                    creditNoteNumber={creditNote.creditNoteNumber}
                  />
                </>
              )}
              {(isIssued || creditNote.status === 'partial') && hasUnappliedBalance && (
                <ApplyCreditNoteDialog
                  creditNoteId={id}
                  creditNoteNumber={creditNote.creditNoteNumber}
                  customerId={creditNote.customerId}
                  currency={creditNote.currency}
                  unappliedAmount={creditNote.unappliedAmount}
                />
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Customer & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Customer Name</p>
              <p className="font-medium">{creditNote.customer?.name || 'N/A'}</p>
            </div>
            {creditNote.customer?.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{creditNote.customer.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credit Note Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {new Date(creditNote.creditNoteDate).toLocaleDateString()}
              </p>
            </div>
            {creditNote.originalInvoice && (
              <div>
                <p className="text-sm text-gray-500">Original Invoice</p>
                <Link
                  href={`/invoices/${creditNote.originalInvoice.id}`}
                  className="font-medium text-orange-600 hover:text-orange-700"
                >
                  {creditNote.originalInvoice.invoiceNumber}
                </Link>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="font-medium">{creditNote.currency}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reason */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reason for Credit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{creditNote.reason}</p>
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
                {creditNote.items.map((item) => (
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
                      {creditNote.currency} {parseFloat(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="text-right py-3">
                      {parseFloat(item.taxRate).toFixed(0)}%
                      <br />
                      <span className="text-sm text-gray-600">
                        {creditNote.currency} {parseFloat(item.taxAmount).toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right py-3 font-medium">
                      {creditNote.currency} {parseFloat(item.itemTotal).toFixed(2)}
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
                  {creditNote.currency} {parseFloat(creditNote.subtotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tax:</span>
                <span className="font-medium">
                  {creditNote.currency} {parseFloat(creditNote.totalTax).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span className="text-red-600">
                  -{creditNote.currency} {parseFloat(creditNote.totalAmount).toFixed(2)}
                </span>
              </div>
              {parseFloat(creditNote.appliedAmount) > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Applied:</span>
                    <span>
                      {creditNote.currency} {parseFloat(creditNote.appliedAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Unapplied Balance:</span>
                    <span className="text-orange-600">
                      {creditNote.currency} {parseFloat(creditNote.unappliedAmount).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications */}
      {creditNote.applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applied To Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creditNote.applications.map((application) => (
                <div
                  key={application.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <Link
                      href={`/invoices/${application.invoice?.id}`}
                      className="font-medium text-orange-600 hover:text-orange-700"
                    >
                      {application.invoice?.invoiceNumber || 'Unknown Invoice'}
                    </Link>
                    <p className="text-sm text-gray-500">
                      Applied on {new Date(application.applicationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-medium text-green-600">
                    {creditNote.currency} {parseFloat(application.appliedAmount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {(creditNote.notes || creditNote.customerNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {creditNote.customerNotes && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Customer Notes</p>
                <p className="text-sm">{creditNote.customerNotes}</p>
              </div>
            )}
            {creditNote.notes && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Internal Notes</p>
                <p className="text-sm">{creditNote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default async function CreditNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/sales/credit-notes"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Credit Notes
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="text-gray-500">Loading credit note...</p>
          </div>
        }
      >
        <CreditNoteDetails id={id} />
      </Suspense>
    </section>
  );
}
