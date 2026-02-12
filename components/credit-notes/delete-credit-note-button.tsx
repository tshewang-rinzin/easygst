'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteCreditNote } from '@/lib/credit-notes/actions';

interface DeleteCreditNoteButtonProps {
  creditNoteId: string;
  creditNoteNumber: string;
}

export function DeleteCreditNoteButton({
  creditNoteId,
  creditNoteNumber,
}: DeleteCreditNoteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', creditNoteId);

      const result = await deleteCreditNote({}, formData);

      if ('error' in result && result.error) {
        setError(result.error);
      } else if ('success' in result && result.success) {
        setOpen(false);
        router.push('/sales/credit-notes');
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Credit Note</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete credit note {creditNoteNumber}?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
