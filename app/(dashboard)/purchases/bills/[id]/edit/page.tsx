'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SupplierBillForm } from '@/components/suppliers/supplier-bill-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditSupplierBillPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/purchases/bills/${billId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error('Error:', data.error);
          setLoading(false);
          return;
        }
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

  if (bill.bill.status !== 'draft') {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Cannot edit a non-draft bill</p>
          <Link href={`/purchases/bills/${billId}`}>
            <Button variant="outline" className="mt-4">
              Back to Bill
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link
          href={`/purchases/bills/${billId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Bill
        </Link>
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Edit Supplier Bill
        </h1>
      </div>

      <SupplierBillForm
        defaultGstRate="5"
        editMode={true}
        billId={billId}
        existingBill={bill}
      />
    </section>
  );
}
