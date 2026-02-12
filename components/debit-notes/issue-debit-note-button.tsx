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
import { issueDebitNote } from '@/lib/debit-notes/actions';

interface IssueDebitNoteButtonProps {
  debitNoteId: string;
  debitNoteNumber: string;
}

export function IssueDebitNoteButton({
  debitNoteId,
  debitNoteNumber,
}: IssueDebitNoteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const handleIssue = async () => {
    setError('');

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', debitNoteId);

      const result = await issueDebitNote({}, formData);

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
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Send className="h-4 w-4 mr-2" />
          Issue
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Issue Debit Note</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to issue debit note {debitNoteNumber}?
            Once issued, you will not be able to edit or delete it.
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
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Issuing...
              </>
            ) : (
              'Issue Debit Note'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
