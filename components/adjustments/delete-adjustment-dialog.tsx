'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { deleteAdjustment } from '@/lib/adjustments/actions';

interface DeleteAdjustmentDialogProps {
  adjustmentId: string;
  adjustmentType: string;
}

export function DeleteAdjustmentDialog({
  adjustmentId,
  adjustmentType,
}: DeleteAdjustmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(deleteAdjustment, { error: '' } as any);

  useEffect(() => {
    if ('success' in state && state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form action={formAction}>
          <input type="hidden" name="id" value={adjustmentId} />
          <DialogHeader>
            <DialogTitle>Delete Adjustment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {adjustmentType.replace('_', ' ')} adjustment?
              This will reverse the adjustment from the invoice.
            </DialogDescription>
          </DialogHeader>

          {'error' in state && state.error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Deleting...' : 'Delete Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
