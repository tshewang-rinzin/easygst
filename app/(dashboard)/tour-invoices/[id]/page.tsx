import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Send, Download, CreditCard, Copy, XCircle, ArrowLeft } from 'lucide-react';
import { getTourInvoice } from '@/lib/db/tour-invoice-queries';
import { CATEGORY_MAP } from '@/lib/tour-invoice/category-presets';
import { SendInvoiceButton, DownloadPDFButton, RecordPaymentButton, DuplicateInvoiceButton, SendReminderButton } from '../components/tour-invoice-actions';

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-yellow-100 text-yellow-700',
    partial: 'bg-orange-100 text-orange-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return <Badge variant="outline" className={styles[status] || ''}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

export default async function TourInvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getTourInvoice(id);
  if (!invoice) notFound();

  // Group items by category
  const itemsByCategory: Record<string, typeof invoice.items> = {};
  invoice.items.forEach((item) => {
    if (!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
    itemsByCategory[item.category].push(item);
  });

  return (
    <section className="flex-1 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/tour-invoices">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg lg:text-2xl font-medium text-gray-900">{invoice.invoiceNumber}</h1>
              {statusBadge(invoice.status)}
            </div>
            <p className="text-sm text-gray-500">{invoice.tourName}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {invoice.status === 'draft' && (
            <Link href={`/tour-invoices/${invoice.id}/edit`}>
              <Button variant="outline" size="sm"><Edit className="mr-1 h-4 w-4" /> Edit</Button>
            </Link>
          )}
          {invoice.status === 'draft' && (
            <SendInvoiceButton invoiceId={invoice.id} />
          )}
          <DownloadPDFButton invoiceId={invoice.id} />
          <DuplicateInvoiceButton invoiceId={invoice.id} />
          {['sent', 'viewed', 'overdue', 'partial'].includes(invoice.status) && parseFloat(invoice.amountDue) > 0 && (
            <SendReminderButton invoiceId={invoice.id} />
          )}
          {invoice.paymentStatus !== 'paid' && (
            <RecordPaymentButton invoiceId={invoice.id} currency={invoice.currency} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tour Details */}
          <Card>
            <CardHeader><CardTitle>Tour Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-500">Customer</span><p className="font-medium">{invoice.customer?.name}</p></div>
                <div><span className="text-gray-500">Tour Type</span><p className="font-medium capitalize">{invoice.tourType}</p></div>
                <div><span className="text-gray-500">Nationality</span><p className="font-medium">{invoice.guestNationality}</p></div>
                <div><span className="text-gray-500">Arrival</span><p className="font-medium">{invoice.arrivalDate ? new Date(invoice.arrivalDate).toLocaleDateString() : '-'}</p></div>
                <div><span className="text-gray-500">Departure</span><p className="font-medium">{invoice.departureDate ? new Date(invoice.departureDate).toLocaleDateString() : '-'}</p></div>
                <div><span className="text-gray-500">Nights</span><p className="font-medium">{invoice.numberOfNights ?? '-'}</p></div>
                <div><span className="text-gray-500">Guests</span><p className="font-medium">{invoice.numberOfGuests}</p></div>
                <div><span className="text-gray-500">Guide</span><p className="font-medium">{invoice.tourGuide || '-'}</p></div>
                <div><span className="text-gray-500">Currency</span><p className="font-medium">{invoice.currency}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Guests */}
          {invoice.guests.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Guest Information</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Passport</TableHead>
                      <TableHead>Visa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.guests.map((guest, i) => (
                      <TableRow key={guest.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{guest.guestName}</TableCell>
                        <TableCell>{guest.nationality}</TableCell>
                        <TableCell>{guest.passportNumber || '-'}</TableCell>
                        <TableCell>{guest.visaNumber || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Items by category */}
          {Object.entries(itemsByCategory).map(([cat, catItems]) => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle>{CATEGORY_MAP[cat]?.label || cat}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{parseFloat(item.quantity).toString()}</TableCell>
                        <TableCell>{item.unit || '-'}</TableCell>
                        <TableCell className="text-right">{parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">{parseFloat(item.itemTotal).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={4} className="text-right font-medium">Category Total</TableCell>
                      <TableCell className="text-right font-bold">
                        {catItems.reduce((s, i) => s + parseFloat(i.itemTotal), 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {/* Inclusions & Exclusions */}
          {((invoice.inclusions as string[])?.length > 0 || (invoice.exclusions as string[])?.length > 0) && (
            <Card>
              <CardHeader><CardTitle>Inclusions & Exclusions</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(invoice.inclusions as string[])?.length > 0 && (
                    <div>
                      <p className="font-medium text-green-700 mb-2">✓ Inclusions</p>
                      <ul className="space-y-1 text-sm">
                        {(invoice.inclusions as string[]).map((item, i) => (
                          <li key={i} className="text-gray-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(invoice.exclusions as string[])?.length > 0 && (
                    <div>
                      <p className="font-medium text-red-700 mb-2">✗ Exclusions</p>
                      <ul className="space-y-1 text-sm">
                        {(invoice.exclusions as string[]).map((item, i) => (
                          <li key={i} className="text-gray-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell className="text-right font-medium">{payment.currency} {parseFloat(payment.amount).toFixed(2)}</TableCell>
                        <TableCell>{payment.transactionId || payment.receiptNumber || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Financial Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{invoice.currency} {parseFloat(invoice.subtotal).toFixed(2)}</span>
              </div>
              {parseFloat(invoice.totalDiscount) > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span>-{invoice.currency} {parseFloat(invoice.totalDiscount).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(invoice.totalTax) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span>{invoice.currency} {parseFloat(invoice.totalTax).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(invoice.sdfTotal) > 0 && (
                <div className="flex justify-between text-sm text-blue-700">
                  <span>SDF</span>
                  <span>USD {parseFloat(invoice.sdfTotal).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span>{invoice.currency} {parseFloat(invoice.grandTotal).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="text-green-600">{invoice.currency} {parseFloat(invoice.amountPaid).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Amount Due</span>
                <span className={parseFloat(invoice.amountDue) > 0 ? 'text-red-600' : 'text-green-600'}>
                  {invoice.currency} {parseFloat(invoice.amountDue).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* SDF Info */}
          {parseFloat(invoice.sdfTotal) > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">SDF Details</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>Rate: USD {parseFloat(invoice.sdfPerPersonPerNight).toFixed(2)} / person / night</p>
                <p>Guests: {invoice.numberOfGuests}</p>
                <p>Nights: {invoice.numberOfNights ?? '-'}</p>
                <p className="font-bold mt-2">Total: USD {parseFloat(invoice.sdfTotal).toFixed(2)}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(invoice.paymentTerms || invoice.notes || invoice.customerNotes) && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-3">
                {invoice.paymentTerms && (
                  <div><span className="text-gray-500 block">Payment Terms</span><p>{invoice.paymentTerms}</p></div>
                )}
                {invoice.customerNotes && (
                  <div><span className="text-gray-500 block">Customer Notes</span><p>{invoice.customerNotes}</p></div>
                )}
                {invoice.notes && (
                  <div><span className="text-gray-500 block">Internal Notes</span><p>{invoice.notes}</p></div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
