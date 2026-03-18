'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteUnit } from '@/lib/products/unit-actions';
import { UnitOfMeasure } from '@/lib/db/schema';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DeleteUnitDialogProps {
  unit: UnitOfMeasure | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUnitDialog({ unit, open, onOpenChange }: DeleteUnitDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!unit) return;

    setIsLoading(true);
    try {
      const result = await deleteUnit({ id: unit.id });
      
      if (result.success) {
        toast.success(result.success);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete unit');
      }
    } catch (error) {
      toast.error('Failed to delete unit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Unit of Measure</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{unit?.name}" ({unit?.abbreviation})?
            <br />
            <br />
            This action cannot be undone. The unit will be permanently removed from your system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Unit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}