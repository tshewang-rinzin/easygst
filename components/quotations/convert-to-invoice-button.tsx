'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { convertToInvoice } from '@/lib/quotations/actions';
import { useRouter } from 'next/navigation';

interface Props {
  quotationId: string;
  quotationNumber: string;
}

export function ConvertToInvoiceButton({ quotationId, quotationNumber }: Props) {
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    if (!confirm(`Convert ${quotationNumber} to an invoice? This will create a new draft invoice with all items copied.`)) {
      return;
    }

    setIsConverting(true);
    const formData = new FormData();
    formData.append('quotationId', quotationId);

    const result = await convertToInvoice({}, formData);
    setIsConverting(false);

    if ('error' in result && result.error) {
      alert(result.error);
    } else if ('invoiceId' in result && result.invoiceId) {
      router.push(`/invoices/${result.invoiceId}`);
    }
  };

  return (
    <Button
      onClick={handleConvert}
      disabled={isConverting}
      className="bg-orange-500 hover:bg-orange-600"
    >
      <FileText className="h-4 w-4 mr-2" />
      {isConverting ? 'Converting...' : 'Convert to Invoice'}
    </Button>
  );
}
