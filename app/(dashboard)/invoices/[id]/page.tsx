import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Send, Download, Ban, FileText } from 'lucide-react';
import { getInvoiceWithDetails } from '@/lib/invoices/queries';
import { notFound } from 'next/navigation';
import { SendInvoiceDialog } from '@/components/invoices/send-invoice-dialog';
import { EmailInvoiceButton } from '@/components/invoices/email-invoice-button';
import { SendReminderButton } from '@/components/invoices/send-reminder-button';
import { DeleteInvoiceDialog } from '@/components/invoices/delete-invoice-dialog';
import { CancelInvoiceDialog } from '@/components/invoices/cancel-invoice-dialog';
import { RecordPaymentDialog } from '@/components/payments/record-payment-dialog';
import { FileAttachments } from '@/components/file-attachments';
import { FeatureGate } from '@/components/feature-gate';
import { getGSTClassification, getGSTClassificationLabel, getGSTClassificationColor } from '@/lib/invoices/gst-classification';

async function InvoiceDetails({ id }: { id: string }) {
  const invoice = await getInvoiceWithDetails(id);

  if (!invoice) {
    notFound();
  }

  const isDraft = invoice.status === 'draft';
  const isLocked = invoice.isLocked;
  const isCancelled = invoice.status === 'cancelled';
  const hasPayments = parseFloat(invoice.amountPaid) > 0;

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{invoice.invoiceNumber}</CardTitle>
              <div className="flex gap-2 mt-2">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : invoice.status === 'sent'
                      ? 'bg-blue-100 text-blue-700'
                      : invoice.status === 'overdue'
                      ? 'bg-red-100 text-red-700'
                      : invoice.status === 'draft'
                      ? 'bg-gray-100 text-gray-700'
                      : invoice.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    invoice.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : invoice.paymentStatus === 'partial'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Payment: {invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {isDraft && !isLocked && (
                <>
                  <Link href={`/invoices/${id}/edit`}>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <SendInvoiceDialog
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoiceNumber}
                    customerEmail={invoice.customer?.email}
                  />
                  <DeleteInvoiceDialog
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoiceNumber}
                  />
                </>
              )}
              {!isDraft && !isCancelled && (
                <>
                  <EmailInvoiceButton
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoiceNumber}
                    customerEmail={invoice.customer?.email}
                  />
                  <SendReminderButton
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoiceNumber}
                    customerEmail={invoice.customer?.email}
                    paymentStatus={invoice.paymentStatus}
                  />
                  <Link href={`/sales/credit-notes/new?invoiceId=${invoice.id}`}>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Credit Note
                    </Button>
                  </Link>
                  <CancelInvoiceDialog
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoiceNumber}
                    hasPayments={hasPayments}
                    amountPaid={invoice.amountPaid}
                    currency={invoice.currency}
                  />
                </>
              )}
              {!isCancelled && (
                <a href={`/api/invoices/${id}/pdf`} download>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cancellation Notice */}
      {isCancelled && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg text-red-700 flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Invoice Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-red-600 font-medium">Reason:</p>
              <p className="text-red-700">{invoice.cancelledReason || 'No reason provided'}</p>
            </div>
            {invoice.cancelledAt && (
              <div>
                <p className="text-sm text-red-600 font-medium">Cancelled on:</p>
                <p className="text-red-700">{new Date(invoice.cancelledAt).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer & Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{invoice.customer?.name || 'N/A'}</p>
            </div>
            {invoice.customer?.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{invoice.customer.email}</p>
              </div>
            )}
            {invoice.customer?.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{invoice.customer.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Invoice Date</p>
              <p className="font-medium">
                {new Date(invoice.invoiceDate).toLocaleDateString()}
              </p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="font-medium">{invoice.currency}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Items</CardTitle>
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
                {invoice.items.map((item) => {
                  const classification = item.gstClassification || getGSTClassification(parseFloat(item.taxRate), item.isTaxExempt);
                  const classificationLabel = getGSTClassificationLabel(classification as any);
                  const classificationColor = getGSTClassificationColor(classification as any);

                  return (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      <p className="font-medium">{item.description}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${classificationColor}`}>
                        {classificationLabel}
                      </span>
                    </td>
                    <td className="text-right py-3">
                      {parseFloat(item.quantity)} {item.unit}
                    </td>
                    <td className="text-right py-3">
                      {invoice.currency} {parseFloat(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="text-right py-3">
                      {item.isTaxExempt ? (
                        <span className="text-gray-500">-</span>
                      ) : (
                        <>
                          {parseFloat(item.taxRate).toFixed(0)}%
                          <br />
                          <span className="text-sm text-gray-600">
                            {invoice.currency} {parseFloat(item.taxAmount || '0').toFixed(2)}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="text-right py-3 font-medium">
                      {invoice.currency} {parseFloat(item.itemTotal || '0').toFixed(2)}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {invoice.currency} {parseFloat(invoice.subtotal).toFixed(2)}
                </span>
              </div>
              {parseFloat(invoice.totalDiscount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-{invoice.currency} {parseFloat(invoice.totalDiscount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tax:</span>
                <span className="font-medium">
                  {invoice.currency} {parseFloat(invoice.totalTax).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span>
                  {invoice.currency} {parseFloat(invoice.totalAmount).toFixed(2)}
                </span>
              </div>
              {parseFloat(invoice.amountPaid) > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paid:</span>
                    <span>-{invoice.currency} {parseFloat(invoice.amountPaid).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-red-600 border-t pt-2">
                    <span>Amount Due:</span>
                    <span>
                      {invoice.currency} {parseFloat(invoice.amountDue).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {(invoice.customerNotes || invoice.notes || invoice.paymentTerms) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.customerNotes && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Customer Notes
                </p>
                <p className="text-sm">{invoice.customerNotes}</p>
              </div>
            )}
            {invoice.paymentTerms && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Payment Terms
                </p>
                <p className="text-sm">{invoice.paymentTerms}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Internal Notes
                </p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Adjustments */}
      {invoice.adjustments && invoice.adjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.adjustments.map((adjustment: any) => {
                const amount = parseFloat(adjustment.amount);
                const isNegative = amount < 0;

                return (
                  <div
                    key={adjustment.id}
                    className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          isNegative
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {adjustment.adjustmentType.replace('_', ' ')}
                        </span>
                        <p className="font-medium">
                          {adjustment.description}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(adjustment.adjustmentDate).toLocaleDateString()}
                        {adjustment.referenceNumber && ` • Ref: ${adjustment.referenceNumber}`}
                      </p>
                      {adjustment.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          {adjustment.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-lg font-semibold ${
                        isNegative ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {isNegative ? '' : '+'}{invoice.currency} {Math.abs(amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments */}
      {((invoice.payments && invoice.payments.length > 0) || (invoice.paymentStatus !== 'paid' && parseFloat(invoice.amountDue) > 0)) && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Payments</CardTitle>
              {invoice.paymentStatus !== 'paid' && parseFloat(invoice.amountDue) > 0 && (
                <RecordPaymentDialog
                  invoiceId={invoice.id}
                  invoiceNumber={invoice.invoiceNumber}
                  currency={invoice.currency}
                  amountDue={invoice.amountDue}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {invoice.payments && invoice.payments.length > 0 ? (
              <div className="space-y-3">
                {invoice.payments.map((payment) => {
                  const adjustmentAmount = parseFloat(payment.adjustmentAmount || '0');
                  const totalPayment = parseFloat(payment.amount) + adjustmentAmount;

                  return (
                  <div
                    key={payment.id}
                    className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="font-medium">
                          {invoice.currency} {parseFloat(payment.amount).toFixed(2)}
                        </p>
                        {adjustmentAmount !== 0 && (
                          <>
                            <span className="text-xs text-gray-500">
                              {adjustmentAmount > 0 ? '+' : ''}{invoice.currency} {adjustmentAmount.toFixed(2)}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              adjustmentAmount < 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {payment.adjustmentReason?.replace('_', ' ') || 'adjustment'}
                            </span>
                          </>
                        )}
                      </div>
                      {adjustmentAmount !== 0 && (
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          Total: {invoice.currency} {totalPayment.toFixed(2)}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(payment.paymentDate).toLocaleDateString()} •{' '}
                        {payment.paymentMethodName || payment.paymentMethod.replace('_', ' ')}
                      </p>
                      {payment.transactionId && (
                        <p className="text-xs text-gray-500">
                          Ref: {payment.transactionId}
                        </p>
                      )}
                      {payment.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No payments recorded yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Attachments */}
      <FeatureGate feature="file_attachments" fallback={null}>
        <FileAttachments
          entityType="invoice"
          entityId={invoice.id}
          folder="invoices"
          title="Attachments"
        />
      </FeatureGate>
    </div>
  );
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Invoices
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="text-gray-500">Loading invoice...</p>
          </div>
        }
      >
        <InvoiceDetails id={id} />
      </Suspense>
    </section>
  );
}
