'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createExpenseCategory, updateExpenseCategory, deleteExpenseCategory, seedExpenseCategories } from '@/lib/expenses/category-actions';
import { PlusCircle, Pencil, Trash2, Sparkles } from 'lucide-react';
import type { ExpenseCategory } from '@/lib/db/schema';

function CategoryForm({
  category,
  onClose,
}: {
  category?: ExpenseCategory;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!category;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const action = isEditing ? updateExpenseCategory : createExpenseCategory;
      const result = await action({}, formData);
      if (result && 'error' in result) {
        toast.error(result.error as string);
      } else {
        toast.success(isEditing ? 'Category updated' : 'Category created');
        onClose();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {isEditing && <input type="hidden" name="id" value={category!.id} />}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Name *</Label>
          <Input name="name" defaultValue={category?.name || ''} required />
        </div>
        <div className="grid gap-2">
          <Label>Code *</Label>
          <Input name="code" defaultValue={category?.code || ''} placeholder="e.g. ELEC" required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Description</Label>
        <Input name="description" defaultValue={category?.description || ''} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>GST Claimable</Label>
          <Select name="gstClaimable" defaultValue={category?.gstClaimable || 'full'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Default GST Rate (%)</Label>
          <Input type="number" step="0.01" name="defaultGstRate" defaultValue={category?.defaultGstRate as string || '0'} />
        </div>
        <div className="grid gap-2">
          <Label>Claimable %</Label>
          <Input type="number" step="0.01" name="claimablePercentage" defaultValue={category?.claimablePercentage as string || '100'} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Account Code (optional)</Label>
        <Input name="accountCode" defaultValue={category?.accountCode || ''} placeholder="For future Chart of Accounts" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="bg-amber-500 hover:bg-amber-800" disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

export function CategoriesManager({ categories }: { categories: ExpenseCategory[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | undefined>();

  const handleSeed = () => {
    startTransition(async () => {
      const result = await seedExpenseCategories();
      if ('error' in result) toast.error(result.error);
      else toast.success(result.success);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this category?')) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', id);
      const result = await deleteExpenseCategory({}, formData);
      if (result && 'error' in result) toast.error(result.error as string);
      else toast.success('Category deleted');
    });
  };

  const claimableBadge = (value: string) => {
    const map: Record<string, string> = {
      full: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      none: 'bg-gray-100 text-gray-600',
    };
    return <Badge className={map[value] || map.none}>{value}</Badge>;
  };

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(undefined); }}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-800">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={editing}
              onClose={() => { setDialogOpen(false); setEditing(undefined); }}
            />
          </DialogContent>
        </Dialog>

        {categories.length === 0 && (
          <Button variant="outline" onClick={handleSeed} disabled={isPending}>
            <Sparkles className="mr-2 h-4 w-4" /> Seed Defaults
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>GST Claimable</TableHead>
              <TableHead>Default Rate</TableHead>
              <TableHead>Claimable %</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell><code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{cat.code}</code></TableCell>
                <TableCell>{claimableBadge(cat.gstClaimable)}</TableCell>
                <TableCell>{cat.defaultGstRate}%</TableCell>
                <TableCell>{cat.claimablePercentage}%</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditing(cat); setDialogOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!cat.isSystem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cat.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No categories yet. Click &quot;Seed Defaults&quot; to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
