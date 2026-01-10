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
                {invoice.team?.name}
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
              <p className="text-lg font-semibold text-gray-900">
                {invoice.customer?.name}
              </p>
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

            {/* Amount */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Total Amount
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(invoice.totalAmount, invoice.currency)}
              </p>
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
