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
import { Send, Loader2 } from 'lucide-react';
import { issueCreditNote } from '@/lib/credit-notes/actions';

interface IssueCreditNoteButtonProps {
  creditNoteId: string;
  creditNoteNumber: string;
}

export function IssueCreditNoteButton({
  creditNoteId,
  creditNoteNumber,
}: IssueCreditNoteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleIssue = async () => {
    setError('');

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', creditNoteId);

      const result = await issueCreditNote({}, formData);

      if ('error' in result && result.error) {
        setError(result.error);
      } else if ('success' in result && result.success) {
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
          <Send className="h-4 w-4 mr-2" />
          Issue
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Issue Credit Note</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to issue credit note {creditNoteNumber}?
            Once issued, it cannot be edited or deleted.
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
            onClick={handleIssue}
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Issuing...
              </>
            ) : (
              'Issue Credit Note'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
