'use client';

import { useState, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { deleteCategory, toggleCategoryStatus } from '@/lib/categories/actions';
import { Trash2, Power, Loader2 } from 'lucide-react';
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

interface CategoryActionsProps {
  categoryId: number;
  isActive: boolean;
}

export function CategoryActions({ categoryId, isActive }: CategoryActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const formData = new FormData();
    formData.set('id', String(categoryId));
    await deleteCategory({}, formData);
    setIsDeleting(false);
  };

  const handleToggleStatus = async () => {
    setIsToggling(true);
    const formData = new FormData();
    formData.set('id', String(categoryId));
    formData.set('isActive', String(!isActive));
    await toggleCategoryStatus({}, formData);
    setIsToggling(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleStatus}
        disabled={isToggling}
      >
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Power className="h-4 w-4" />
        )}
      </Button>

      {!isActive && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this category? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
