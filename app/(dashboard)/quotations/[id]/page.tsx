import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Send, FileText, ArrowRight } from 'lucide-react';
import { getQuotationById } from '@/lib/quotations/queries';
import { notFound } from 'next/navigation';
import { QuotationStatusActions } from '@/components/quotations/quotation-status-actions';
import { DeleteQuotationDialog } from '@/components/quotations/delete-quotation-dialog';
import { ConvertToInvoiceButton } from '@/components/quotations/convert-to-invoice-button';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-yellow-100 text-yellow-700',
  converted: 'bg-purple-100 text-purple-700',
};

async function QuotationDetails({ id }: { id: string }) {
  const quotation = await getQuotationById(id);

  if (!quotation) {
    notFound();
  }

  const isDraft = quotation.status === 'draft';
  const isSent = quotation.status === 'sent';
  const isAccepted = quotation.status === 'accepted';
  const isConverted = quotation.status === 'converted';

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{quotation.quotationNumber}</CardTitle>
              <div className="flex gap-2 mt-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[quotation.status] || 'bg-gray-100 text-gray-700'}`}>
                  {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {isDraft && (
                <>
                  <Link href={`/quotations/${id}/edit`}>
                    <Button variant="outline"><Edit className="h-4 w-4 mr-2" />Edit</Button>
                  </Link>
                  <QuotationStatusActions quotationId={id} currentStatus="draft" quotationNumber={quotation.quotationNumber} customerEmail={quotation.customer?.email} />
                  <DeleteQuotationDialog quotationId={id} quotationNumber={quotation.quotationNumber} />
                </>
              )}
              {isSent && (
                <QuotationStatusActions quotationId={id} currentStatus="sent" quotationNumber={quotation.quotationNumber} customerEmail={quotation.customer?.email} />
              )}
              {isAccepted && (
                <ConvertToInvoiceButton quotationId={id} quotationNumber={quotation.quotationNumber} />
              )}
              {isConverted && quotation.convertedToInvoiceId && (
                <Link href={`/invoices/${quotation.convertedToInvoiceId}`}>
                  <Button className="bg-purple-500 hover:bg-purple-600">
                    <ArrowRight className="h-4 w-4 mr-2" />View Invoice
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quotation Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
          <CardContent>
            {quotation.customer ? (
              <div className="space-y-1">
                <p className="font-semibold">{quotation.customer.name}</p>
                {quotation.customer.email && <p className="text-sm text-gray-600">{quotation.customer.email}</p>}
                {quotation.customer.phone && <p className="text-sm text-gray-600">{quotation.customer.phone}</p>}
                {quotation.customer.address && <p className="text-sm text-gray-600">{quotation.customer.address}</p>}
              </div>
            ) : (
              <p className="text-gray-500">No customer info</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Date(quotation.quotationDate).toLocaleDateString()}</span>
              </div>
              {quotation.validUntil && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Valid Until:</span>
                  <span>{new Date(quotation.validUntil).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Currency:</span>
                <span>{quotation.currency}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Description</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Qty</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Unit</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Price</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Disc</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Tax</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, index) => (
                <tr key={item.id} className="border-b">
                  <td className="py-3 px-4 text-sm">{index + 1}</td>
                  <td className="py-3 px-4 text-sm">{item.description}</td>
                  <td className="py-3 px-4 text-sm text-right">{parseFloat(item.quantity).toString()}</td>
                  <td className="py-3 px-4 text-sm">{item.unit || '-'}</td>
                  <td className="py-3 px-4 text-sm text-right">{parseFloat(item.unitPrice).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-right">{parseFloat(item.discountAmount || '0').toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-right">{parseFloat(item.taxAmount).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-right font-medium">{parseFloat(item.itemTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 flex justify-end">
            <div className="w-full md:w-2/5 space-y-2 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{parseFloat(quotation.subtotal).toFixed(2)}</span>
              </div>
              {parseFloat(quotation.totalDiscount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span className="font-medium">-{parseFloat(quotation.totalDiscount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST:</span>
                <span className="font-medium">{parseFloat(quotation.totalTax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-orange-600">{quotation.currency} {parseFloat(quotation.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {(quotation.customerNotes || quotation.termsAndConditions || quotation.notes) && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {quotation.customerNotes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Customer Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.customerNotes}</p>
              </div>
            )}
            {quotation.termsAndConditions && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Terms & Conditions</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.termsAndConditions}</p>
              </div>
            )}
            {quotation.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Internal Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link href="/quotations" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" />Back to Quotations
        </Link>
      </div>
      <Suspense fallback={<div className="animate-pulse"><div className="h-48 bg-gray-200 rounded-lg"></div></div>}>
        <QuotationDetails id={id} />
      </Suspense>
    </section>
  );
}
