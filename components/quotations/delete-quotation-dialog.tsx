'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteQuotation } from '@/lib/quotations/actions';
import { useRouter } from 'next/navigation';

interface Props {
  quotationId: string;
  quotationNumber: string;
}

export function DeleteQuotationDialog({ quotationId, quotationNumber }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${quotationNumber}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const formData = new FormData();
    formData.append('id', quotationId);

    const result = await deleteQuotation({}, formData);
    setIsDeleting(false);

    if ('error' in result && result.error) {
      alert(result.error);
    } else {
      router.push('/quotations');
    }
  };

  return (
    <Button
      onClick={handleDelete}
      disabled={isDeleting}
      variant="destructive"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
