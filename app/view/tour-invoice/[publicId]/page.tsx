import { notFound } from 'next/navigation';
import { getTourInvoiceByPublicId, markTourInvoiceViewed } from '@/lib/db/tour-invoice-queries';
import { calcSDFMixed, isSdfExempt } from '@/lib/tour-invoice/sdf';
import { CheckCircle, XCircle, Clock, AlertCircle, Download, Plane } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  accommodation: 'Accommodation',
  domestic_flight: 'Domestic Flights',
  international_flight: 'International Flights',
  transport: 'Transport',
  guide: 'Guide',
  meals: 'Meals',
  permits: 'Permits & Entry Fees',
  activities: 'Activities',
  visa: 'Visa',
  miscellaneous: 'Miscellaneous',
};

interface Props {
  params: Promise<{ publicId: string }>;
}

export default async function PublicTourInvoicePage({ params }: Props) {
  const { publicId } = await params;
  const invoice = await getTourInvoiceByPublicId(publicId);

  if (!invoice) {
    notFound();
  }

  // Mark as viewed
  await markTourInvoiceViewed(publicId);

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string, currency: string) => {
    return `${currency} ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusDisplay = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'paid') {
      return { icon: CheckCircle, text: 'Paid', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    }
    if (status === 'cancelled') {
      return { icon: XCircle, text: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    }
    if (paymentStatus === 'partial') {
      return { icon: Clock, text: 'Partially Paid', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    }
    return { icon: AlertCircle, text: 'Unpaid', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
  };

  const statusDisplay = getStatusDisplay(invoice.status, invoice.paymentStatus);
  const StatusIcon = statusDisplay.icon;

  // Group items by category
  const itemsByCategory: Record<string, typeof invoice.items> = {};
  invoice.items.forEach((item) => {
    if (!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
    itemsByCategory[item.category].push(item);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Verification Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-3">
            <Plane className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tour Invoice</h1>
          <p className="text-gray-600 mt-1">
            Issued by {invoice.team?.name || invoice.team?.businessName}
          </p>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Invoice Number</p>
                <p className="text-xl font-bold">{invoice.invoiceNumber}</p>
              </div>
              <div className={`px-3 py-1 rounded-full ${statusDisplay.bg} ${statusDisplay.border} border`}>
                <span className={`text-sm font-medium ${statusDisplay.color}`}>{statusDisplay.text}</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Issuer */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Issued By</p>
              <p className="text-lg font-semibold text-gray-900">{invoice.team?.businessName || invoice.team?.name}</p>
              {invoice.team?.tpn && <p className="text-sm text-gray-600">TPN: {invoice.team.tpn}</p>}
              {invoice.team?.gstNumber && <p className="text-sm text-gray-600">GST: {invoice.team.gstNumber}</p>}
            </div>

            {/* Billed To */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Billed To</p>
              <p className="text-lg font-semibold text-gray-900">{invoice.customer?.name}</p>
              {invoice.customer?.email && <p className="text-sm text-gray-600">{invoice.customer.email}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Invoice Date</p>
                <p className="text-gray-900">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Due Date</p>
                <p className="text-gray-900">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            {/* Tour Details */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-3">Tour Details</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-600">Tour Name:</span>
                  <span className="ml-2 text-gray-900 font-medium">{invoice.tourName}</span>
                </div>
                <div>
                  <span className="text-blue-600">Type:</span>
                  <span className="ml-2 text-gray-900 capitalize">{invoice.tourType}</span>
                </div>
                <div>
                  <span className="text-blue-600">Arrival:</span>
                  <span className="ml-2 text-gray-900">{formatDate(invoice.arrivalDate)}</span>
                </div>
                <div>
                  <span className="text-blue-600">Departure:</span>
                  <span className="ml-2 text-gray-900">{formatDate(invoice.departureDate)}</span>
                </div>
                <div>
                  <span className="text-blue-600">Nights:</span>
                  <span className="ml-2 text-gray-900">{invoice.numberOfNights ?? '-'}</span>
                </div>
                <div>
                  <span className="text-blue-600">Guests:</span>
                  <span className="ml-2 text-gray-900">{invoice.numberOfGuests}</span>
                </div>
                <div>
                  <span className="text-blue-600">Nationality:</span>
                  <span className="ml-2 text-gray-900">{invoice.guestNationality}</span>
                </div>
                {invoice.tourGuide && (
                  <div>
                    <span className="text-blue-600">Guide:</span>
                    <span className="ml-2 text-gray-900">{invoice.tourGuide}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Guests */}
            {invoice.guests.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Guest Information</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-600">#</th>
                        <th className="text-left px-3 py-2 text-gray-600">Name</th>
                        <th className="text-left px-3 py-2 text-gray-600">Nationality</th>
                        <th className="text-left px-3 py-2 text-gray-600">Passport</th>
                        <th className="text-left px-3 py-2 text-gray-600">Visa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.guests.map((guest, i) => (
                        <tr key={guest.id} className="border-t">
                          <td className="px-3 py-2">{i + 1}</td>
                          <td className="px-3 py-2 font-medium">{guest.guestName}</td>
                          <td className="px-3 py-2">
                            <span className="flex items-center gap-1">
                              {guest.nationality}
                              {isSdfExempt(guest.nationality) && (
                                <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">Exempt</span>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-2">{guest.passportNumber || '-'}</td>
                          <td className="px-3 py-2">{guest.visaNumber || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Items by Category */}
            {Object.entries(itemsByCategory).map(([cat, catItems]) => (
              <div key={cat}>
                <p className="text-sm font-medium text-gray-700 mb-2">{CATEGORY_LABELS[cat] || cat}</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-600">Description</th>
                        <th className="text-right px-3 py-2 text-gray-600">Qty</th>
                        <th className="text-right px-3 py-2 text-gray-600">Rate</th>
                        <th className="text-right px-3 py-2 text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-3 py-2">{item.description}</td>
                          <td className="px-3 py-2 text-right">{parseFloat(item.quantity).toString()}{item.unit ? ` ${item.unit}` : ''}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.itemTotal, invoice.currency)}</td>
                        </tr>
                      ))}
                      <tr className="border-t bg-gray-50">
                        <td colSpan={3} className="px-3 py-2 text-right font-medium text-gray-600">Category Total</td>
                        <td className="px-3 py-2 text-right font-bold">
                          {formatCurrency(catItems.reduce((s, i) => s + parseFloat(i.itemTotal), 0).toFixed(2), invoice.currency)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* SDF */}
            {(() => {
              const sdfMixed = invoice.guests.length > 0
                ? calcSDFMixed(
                    invoice.guests.map((g: any) => ({ nationality: g.nationality })),
                    invoice.numberOfNights
                  )
                : null;
              const hasMixed = sdfMixed && sdfMixed.isMixed;

              if (parseFloat(invoice.sdfTotal) > 0) {
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-medium text-blue-800 text-sm">Sustainable Development Fee (SDF)</p>
                    {hasMixed ? (
                      <div className="mt-2 space-y-1">
                        {sdfMixed.breakdown.map((b, i) => (
                          <p key={i} className="text-blue-700 text-sm">
                            {b.count} × {b.nationality} × {b.nights} night{b.nights !== 1 ? 's' : ''} × USD {b.ratePerNight.toFixed(2)} = USD {b.subtotal.toFixed(2)}
                            {b.isExempt && <span className="text-green-600 ml-1">(exempt)</span>}
                          </p>
                        ))}
                        <p className="text-blue-900 font-bold text-sm mt-2">
                          Total SDF: USD {parseFloat(invoice.sdfTotal).toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-blue-700 text-sm mt-1">
                        {invoice.numberOfGuests} guest{invoice.numberOfGuests !== 1 ? 's' : ''} × {invoice.numberOfNights ?? 0} night{(invoice.numberOfNights ?? 0) !== 1 ? 's' : ''} × USD {parseFloat(invoice.sdfPerPersonPerNight).toFixed(2)} = USD {parseFloat(invoice.sdfTotal).toFixed(2)}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Inclusions / Exclusions */}
            {((invoice.inclusions as string[])?.length > 0 || (invoice.exclusions as string[])?.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {(invoice.inclusions as string[])?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">✓ Inclusions</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {(invoice.inclusions as string[]).map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(invoice.exclusions as string[])?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-1">✗ Exclusions</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {(invoice.exclusions as string[]).map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Grand Total */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {parseFloat(invoice.totalDiscount) > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(invoice.totalDiscount, invoice.currency)}</span>
                </div>
              )}
              {parseFloat(invoice.totalTax) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatCurrency(invoice.totalTax, invoice.currency)}</span>
                </div>
              )}
              {parseFloat(invoice.sdfTotal) > 0 && (
                <div className="flex justify-between text-sm text-blue-700">
                  <span>SDF</span>
                  <span>USD {parseFloat(invoice.sdfTotal).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Grand Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(invoice.grandTotal, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.customerNotes && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{invoice.customerNotes}</p>
              </div>
            )}
            {invoice.paymentTerms && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Payment Terms</p>
                <p className="text-sm text-gray-700">{invoice.paymentTerms}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Viewed on {new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This is a verified tour invoice.
            <br />
            For any concerns, please contact the issuing business directly.
          </p>
        </div>
      </div>
    </div>
  );
}
