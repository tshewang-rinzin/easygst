'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { approveExpense, deleteExpense, voidExpense } from '@/lib/expenses/actions';
import { Pencil, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export function ExpenseActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = (action: typeof approveExpense, successMsg: string, redirectTo?: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', id);
      const result = await action({}, formData);
      if (result && 'error' in result) {
        toast.error(result.error as string);
      } else {
        toast.success(successMsg);
        if (redirectTo) router.push(redirectTo);
      }
    });
  };

  return (
    <div className="flex gap-2">
      {status === 'draft' && (
        <>
          <Link href={`/expenses/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
          </Link>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            disabled={isPending}
            onClick={() => handleAction(approveExpense, 'Expense approved')}
          >
            <CheckCircle className="mr-1 h-4 w-4" /> Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => handleAction(deleteExpense, 'Expense deleted', '/expenses')}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </>
      )}
      {status === 'approved' && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handleAction(voidExpense, 'Expense voided')}
        >
          <XCircle className="mr-1 h-4 w-4" /> Void
        </Button>
      )}
    </div>
  );
}
