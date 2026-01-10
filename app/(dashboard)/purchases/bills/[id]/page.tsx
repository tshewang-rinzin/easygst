'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, FileText, Building2, DollarSign, Trash2 } from 'lucide-react';
import { RecordPaymentDialog } from '@/components/suppliers/record-payment-dialog';
import useSWR, { mutate } from 'swr';
import { deleteSupplierPayment } from '@/lib/supplier-payments/actions';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ViewSupplierBillPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Fetch payments for this bill
  const { data: payments, mutate: mutatePayments } = useSWR(
    billId ? `/api/purchases/bills/${billId}/payments` : null,
    fetcher
  );

  useEffect(() => {
    fetch(`/api/purchases/bills/${billId}`)
      .then((res) => res.json())
      .then((data) => {
        setBill(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching bill:', error);
        setLoading(false);
      });
  }, [billId]);

  if (loading) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading bill...</p>
        </div>
      </section>
    );
  }

  if (!bill || bill.error) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Bill not found</p>
          <Link href="/purchases/bills">
            <Button variant="outline" className="mt-4">
              Back to Bills
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
      overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={`${config.className} hover:${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-800' },
      partial: { label: 'Partially Paid', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
    };

    const config = statusConfig[status] || statusConfig.unpaid;
    return (
      <Badge className={`${config.className} hover:${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    const formData = new FormData();
    formData.append('id', paymentId.toString());

    const result = await deleteSupplierPayment({}, formData);
    if ('success' in result && result.success) {
      mutate(`/api/purchases/bills/${billId}`);
      mutatePayments();
    } else {
      alert(('error' in result && result.error) || 'Failed to delete payment');
    }
  };

  // Display payment method name from settings, fallback to code if name not found
  const getPaymentMethodLabel = (methodName: string | null, methodCode: string) => {
    return methodName || methodCode;
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href="/purchases/bills"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Bills
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900 flex items-center gap-3">
              <FileText className="h-6 w-6" />
              {bill.bill.billNumber}
              {getStatusBadge(bill.bill.status)}
              {getPaymentStatusBadge(bill.bill.paymentStatus)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Created on {new Date(bill.bill.createdAt).toLocaleDateString()}
            </p>
          </div>
          {bill.bill.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/purchases/bills/${billId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Bill
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Supplier Name</p>
                <p className="font-medium">{bill.supplier?.name || 'N/A'}</p>
              </div>
              {bill.supplier?.gstNumber && (
                <div>
                  <p className="text-sm text-gray-500">GST Number</p>
                  <p className="font-medium">{bill.supplier.gstNumber}</p>
                </div>
              )}
              {bill.supplier?.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{bill.supplier.email}</p>
                </div>
              )}
              {bill.supplier?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{bill.supplier.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-gray-700">
                        Description
                      </th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">
                        Qty
                      </th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">
                        Unit Price
                      </th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">
                        GST %
                      </th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 text-sm">{item.item.description}</td>
                        <td className="text-right py-3 text-sm">
                          {parseFloat(item.item.quantity).toFixed(2)} {item.item.unit}
                        </td>
                        <td className="text-right py-3 text-sm">
                          {bill.bill.currency} {parseFloat(item.item.unitPrice).toFixed(2)}
                        </td>
                        <td className="text-right py-3 text-sm">
                          {item.item.isTaxExempt ? (
                            <span className="text-gray-500">Exempt</span>
                          ) : (
                            `${parseFloat(item.item.taxRate).toFixed(0)}%`
                          )}
                        </td>
                        <td className="text-right py-3 text-sm font-medium">
                          {bill.bill.currency} {parseFloat(item.item.itemTotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-end">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        {bill.bill.currency} {parseFloat(bill.bill.subtotal).toFixed(2)}
                      </span>
                    </div>
                    {parseFloat(bill.bill.totalDiscount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Discount:</span>
                        <span className="font-medium text-green-600">
                          -{bill.bill.currency} {parseFloat(bill.bill.totalDiscount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total GST (Input):</span>
                      <span className="font-medium">
                        {bill.bill.currency} {parseFloat(bill.bill.totalTax).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Amount:</span>
                      <span>
                        {bill.bill.currency} {parseFloat(bill.bill.totalAmount).toFixed(2)}
                      </span>
                    </div>
                    {parseFloat(bill.bill.amountPaid) > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="font-medium text-green-600">
                            -{bill.bill.currency} {parseFloat(bill.bill.amountPaid).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-red-600 border-t pt-2">
                          <span>Amount Due:</span>
                          <span>
                            {bill.bill.currency} {parseFloat(bill.bill.amountDue).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {bill.bill.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {bill.bill.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payments */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payments</CardTitle>
                {bill.bill.paymentStatus !== 'paid' && (
                  <Button
                    size="sm"
                    onClick={() => setShowPaymentDialog(true)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {bill.bill.currency} {parseFloat(payment.amount).toFixed(2)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getPaymentMethodLabel(payment.paymentMethodName, payment.paymentMethod)}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            Date: {new Date(payment.paymentDate).toLocaleDateString()}
                          </p>
                          {payment.transactionId && (
                            <p>Transaction ID: {payment.transactionId}</p>
                          )}
                          {payment.receiptNumber && (
                            <p>Receipt: {payment.receiptNumber}</p>
                          )}
                          {payment.bankName && <p>Bank: {payment.bankName}</p>}
                          {payment.chequeNumber && (
                            <p>Cheque: {payment.chequeNumber}</p>
                          )}
                          {payment.notes && (
                            <p className="mt-2 italic">{payment.notes}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No payments recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bill Details */}
          <Card>
            <CardHeader>
              <CardTitle>Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Bill Date</p>
                <p className="font-medium">{new Date(bill.bill.billDate).toLocaleDateString()}</p>
              </div>
              {bill.bill.dueDate && (
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">{new Date(bill.bill.dueDate).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Currency</p>
                <p className="font-medium">{bill.bill.currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-1">{getStatusBadge(bill.bill.status)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <div className="mt-1">{getPaymentStatusBadge(bill.bill.paymentStatus)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bill.bill.status === 'draft' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/purchases/bills/${billId}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Bill
                </Button>
              )}
              <Link href={`/adjustments/bills/new?billId=${billId}`}>
                <Button variant="outline" className="w-full">
                  Add Adjustment
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <RecordPaymentDialog
          billId={billId}
          amountDue={bill.bill.amountDue}
          currency={bill.bill.currency}
          onClose={() => setShowPaymentDialog(false)}
          onSuccess={() => {
            setShowPaymentDialog(false);
            mutate(`/api/purchases/bills/${billId}`);
            mutatePayments();
          }}
        />
      )}
    </section>
  );
}
