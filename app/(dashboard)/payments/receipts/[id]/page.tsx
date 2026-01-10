'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Mail, Trash2 } from 'lucide-react';
import { deleteCustomerPayment } from '@/lib/customer-payments/actions';
import { sendPaymentReceiptEmail } from '@/lib/email/actions';
import { mutate } from 'swr';

export default function ViewReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/customer-payments/${paymentId}`)
      .then((res) => res.json())
      .then((data) => {
        setPayment(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching payment:', error);
        setLoading(false);
      });
  }, [paymentId]);

  const handleSendEmail = async () => {
    if (!payment.customer?.email) {
      alert('Customer does not have an email address');
      return;
    }

    setSendingEmail(true);
    setEmailSuccess(false);

    try {
      const result = await sendPaymentReceiptEmail(paymentId);
      if (result.success) {
        setEmailSuccess(true);
        setTimeout(() => setEmailSuccess(false), 3000);
      } else {
        alert(result.error || 'Failed to send email');
      }
    } catch (error) {
      alert('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this payment? This will reverse all allocations to invoices.')) {
      return;
    }

    const formData = new FormData();
    formData.append('id', paymentId.toString());

    const result = await deleteCustomerPayment({}, formData);
    if ('success' in result && result.success) {
      mutate('/api/customer-payments');
      router.push('/payments/receipts');
    } else {
      alert(('error' in result && result.error) || 'Failed to delete payment');
    }
  };

  if (loading) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading receipt...</p>
        </div>
      </section>
    );
  }

  if (!payment || payment.error) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Receipt not found</p>
          <Link href="/payments/receipts">
            <Button variant="outline" className="mt-4">
              Back to Receipts
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  const getPaymentMethodLabel = (methodName: string | null, methodCode: string) => {
    return methodName || methodCode;
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/payments/receipts"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Receipts
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900 flex items-center gap-3">
              Receipt: {payment.receiptNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Received on {new Date(payment.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            {payment.customer?.email && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className={emailSuccess ? 'bg-green-50 border-green-200 text-green-700' : ''}
              >
                <Mail className="h-4 w-4 mr-2" />
                {sendingEmail ? 'Sending...' : emailSuccess ? 'Sent!' : 'Email Receipt'}
              </Button>
            )}
            <Link href={`/api/payments/receipts/${paymentId}/pdf`} target="_blank">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Customer Name</p>
                <p className="font-medium">{payment.customer?.name || 'N/A'}</p>
              </div>
              {payment.customer?.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{payment.customer.email}</p>
                </div>
              )}
              {payment.customer?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{payment.customer.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Allocations */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              {payment.allocations && payment.allocations.length > 0 ? (
                <div className="space-y-4">
                  {payment.allocations.map((allocation: any) => (
                    <div
                      key={allocation.id}
                      className="flex justify-between items-start p-4 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <Link
                          href={`/sales/invoices/${allocation.invoice?.id}`}
                          className="text-lg font-medium text-orange-600 hover:text-orange-700"
                        >
                          {allocation.invoice?.invoiceNumber || 'N/A'}
                        </Link>
                        <div className="text-sm text-gray-600 mt-1">
                          <p>
                            Invoice Date:{' '}
                            {allocation.invoice?.invoiceDate
                              ? new Date(allocation.invoice.invoiceDate).toLocaleDateString()
                              : 'N/A'}
                          </p>
                          <p>
                            Total Amount: {allocation.invoice?.currency}{' '}
                            {allocation.invoice?.totalAmount
                              ? parseFloat(allocation.invoice.totalAmount).toFixed(2)
                              : '0.00'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Allocated</p>
                        <p className="text-lg font-semibold text-green-600">
                          {payment.currency} {parseFloat(allocation.allocatedAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-medium">Total Allocated:</span>
                      <span className="font-semibold text-green-600">
                        {payment.currency} {parseFloat(payment.allocatedAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No allocations for this payment
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {payment.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{payment.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Receipt Number</p>
                <p className="font-medium">{payment.receiptNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Amount</p>
                <p className="text-xl font-bold text-green-600">
                  {payment.currency} {parseFloat(payment.amount).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Date</p>
                <p className="font-medium">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <Badge variant="outline">
                  {getPaymentMethodLabel(payment.paymentMethodName, payment.paymentMethod)}
                </Badge>
              </div>
              {payment.allocatedAmount && (
                <>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500">Allocated Amount</p>
                    <p className="font-medium text-green-600">
                      {payment.currency} {parseFloat(payment.allocatedAmount).toFixed(2)}
                    </p>
                  </div>
                  {parseFloat(payment.unallocatedAmount) > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Unallocated Amount</p>
                      <p className="font-medium text-yellow-600">
                        {payment.currency} {parseFloat(payment.unallocatedAmount).toFixed(2)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payment.transactionId && (
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-medium">{payment.transactionId}</p>
                </div>
              )}
              {payment.paymentGateway && (
                <div>
                  <p className="text-sm text-gray-500">Payment Gateway</p>
                  <p className="font-medium">{payment.paymentGateway}</p>
                </div>
              )}
              {payment.bankName && (
                <div>
                  <p className="text-sm text-gray-500">Bank</p>
                  <p className="font-medium">{payment.bankName}</p>
                </div>
              )}
              {payment.chequeNumber && (
                <div>
                  <p className="text-sm text-gray-500">Cheque Number</p>
                  <p className="font-medium">{payment.chequeNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
