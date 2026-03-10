import { notFound } from 'next/navigation';
import { getInvoiceByPublicId } from '@/lib/invoices/queries';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface Props {
  params: Promise<{ publicId: string }>;
}

export default async function VerifyInvoicePage({ params }: Props) {
  const { publicId } = await params;
  const invoice = await getInvoiceByPublicId(publicId);

  if (!invoice) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
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
      return {
        icon: CheckCircle,
        text: 'Paid',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
      };
    }
    if (status === 'cancelled') {
      return {
        icon: XCircle,
        text: 'Cancelled',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
      };
    }
    if (paymentStatus === 'partial') {
      return {
        icon: Clock,
        text: 'Partially Paid',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
      };
    }
    return {
      icon: AlertCircle,
      text: 'Unpaid',
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
    };
  };

  const statusDisplay = getStatusDisplay(invoice.status, invoice.paymentStatus);
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Verification Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Verified</h1>
          <p className="text-gray-600 mt-1">
            This is a valid invoice issued by {invoice.team?.name}
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
              <div
                className={`px-3 py-1 rounded-full ${statusDisplay.bg} ${statusDisplay.border} border`}
              >
                <span className={`text-sm font-medium ${statusDisplay.color}`}>
                  {statusDisplay.text}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Issuer */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Issued By</p>
              <p className="text-lg font-semibold text-gray-900">
                {invoice.team?.businessName || invoice.team?.name}
              </p>
              {invoice.team?.tpn && (
                <p className="text-sm text-gray-600">TPN: {invoice.team.tpn}</p>
              )}
              {invoice.team?.gstNumber && (
                <p className="text-sm text-gray-600">
                  GST: {invoice.team.gstNumber}
                </p>
              )}
              {invoice.team?.address && (
                <p className="text-sm text-gray-600">{invoice.team.address}</p>
              )}
              {invoice.team?.city && invoice.team?.dzongkhag && (
                <p className="text-sm text-gray-600">
                  {invoice.team.city}, {invoice.team.dzongkhag}
                </p>
              )}
            </div>

            {/* Billed To */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Billed To</p>
              {invoice.customer?.customerType === 'government' ? (
                <>
                  {invoice.customer?.contactPerson && (
                    <p className="text-lg font-semibold text-gray-900">{invoice.customer.contactPerson}</p>
                  )}
                  {invoice.customer?.department && (
                    <p className="text-sm text-gray-700">{invoice.customer.department}</p>
                  )}
                  <p className={invoice.customer?.contactPerson ? "text-sm text-gray-700" : "text-lg font-semibold text-gray-900"}>
                    {invoice.customer?.name}
                  </p>
                </>
              ) : (
                <p className="text-lg font-semibold text-gray-900">
                  {invoice.customer?.name}
                </p>
              )}
            </div>

            {/* Details Grid */}
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

            {/* Contract Amount */}
            {invoice.contractAmount && parseFloat(invoice.contractAmount) > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs font-medium text-blue-600">Total Contract Value</p>
                <p className="text-lg font-semibold text-blue-900">
                  {formatCurrency(invoice.contractAmount, invoice.currency)}
                </p>
              </div>
            )}

            {/* Line Items */}
            {invoice.items && invoice.items.length > 0 && (() => {
              const allService = invoice.items.every(
                (item) => item.lineItemType === 'service' || item.lineItemType === 'milestone'
              );
              return (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Items</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-600 font-medium">Description</th>
                          {!allService && (
                            <>
                              <th className="text-right px-3 py-2 text-gray-600 font-medium">Qty</th>
                              <th className="text-right px-3 py-2 text-gray-600 font-medium">Unit Price</th>
                            </>
                          )}
                          <th className="text-right px-3 py-2 text-gray-600 font-medium">Tax</th>
                          <th className="text-right px-3 py-2 text-gray-600 font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoice.items.map((item, idx) => {
                          const isService = item.lineItemType === 'service' || item.lineItemType === 'milestone';
                          const desc = item.percentage && parseFloat(item.percentage) > 0
                            ? `${item.description} (${parseFloat(item.percentage)}%)`
                            : item.description;
                          return (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-gray-900">{desc}</td>
                              {!allService && (
                                <>
                                  <td className="text-right px-3 py-2 text-gray-700">
                                    {isService ? '-' : parseFloat(item.quantity).toLocaleString()}
                                  </td>
                                  <td className="text-right px-3 py-2 text-gray-700">
                                    {isService ? '-' : formatCurrency(item.unitPrice, invoice.currency)}
                                  </td>
                                </>
                              )}
                              <td className="text-right px-3 py-2 text-gray-700">
                                {item.isTaxExempt ? 'Exempt' : `${parseFloat(item.taxRate)}%`}
                              </td>
                              <td className="text-right px-3 py-2 text-gray-900 font-medium">
                                {formatCurrency(item.itemTotal, invoice.currency)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {parseFloat(invoice.totalDiscount) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(invoice.totalDiscount, invoice.currency)}</span>
                </div>
              )}
              {parseFloat(invoice.totalTax) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span>{formatCurrency(invoice.totalTax, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Verified on {new Date().toLocaleDateString('en-GB', {
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
            This verification confirms the invoice authenticity.
            <br />
            For any concerns, please contact the issuing business directly.
          </p>
        </div>
      </div>
    </div>
  );
}
