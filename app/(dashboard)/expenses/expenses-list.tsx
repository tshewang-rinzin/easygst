'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Search, Eye, Pencil, Trash2, CheckCircle, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { approveExpense, deleteExpense } from '@/lib/expenses/actions';
import type { ExpenseCategory } from '@/lib/db/schema';

interface ExpenseRow {
  id: string;
  expenseNumber: string;
  expenseDate: Date;
  description: string;
  amount: string | null;
  gstAmount: string | null;
  totalAmount: string | null;
  claimableGstAmount: string | null;
  status: string;
  categoryName: string | null;
  categoryCode: string | null;
  supplierName: string | null;
}

const statusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
    claimed: { label: 'Claimed', className: 'bg-blue-100 text-blue-800' },
    void: { label: 'Void', className: 'bg-red-100 text-red-600' },
  };
  const v = variants[status] || variants.draft;
  return <Badge className={v.className}>{v.label}</Badge>;
};

export function ExpensesList({
  expenses,
  categories,
  filters,
}: {
  expenses: ExpenseRow[];
  categories: ExpenseCategory[];
  filters: { search?: string; categoryId?: string; status?: string };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(filters.search || '');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filters.categoryId) params.set('category', filters.categoryId);
    if (filters.status) params.set('status', filters.status);
    router.push(`/expenses?${params.toString()}`);
  };

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.categoryId) params.set('category', filters.categoryId);
    if (filters.status) params.set('status', filters.status);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/expenses?${params.toString()}`);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === expenses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(expenses.map((e) => e.id)));
    }
  };

  const handleBulkApprove = async () => {
    const drafts = expenses.filter((e) => selected.has(e.id) && e.status === 'draft');
    if (drafts.length === 0) {
      toast.error('No draft expenses selected');
      return;
    }
    startTransition(async () => {
      for (const exp of drafts) {
        const formData = new FormData();
        formData.set('id', exp.id);
        await approveExpense({}, formData);
      }
      toast.success(`${drafts.length} expense(s) approved`);
      setSelected(new Set());
    });
  };

  const handleBulkDelete = async () => {
    const drafts = expenses.filter((e) => selected.has(e.id) && e.status === 'draft');
    if (drafts.length === 0) {
      toast.error('No draft expenses selected');
      return;
    }
    startTransition(async () => {
      for (const exp of drafts) {
        const formData = new FormData();
        formData.set('id', exp.id);
        await deleteExpense({}, formData);
      }
      toast.success(`${drafts.length} expense(s) deleted`);
      setSelected(new Set());
    });
  };

  const fmt = (v: string | null) =>
    parseFloat(v || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 });

  if (expenses.length === 0 && !filters.search && !filters.categoryId && !filters.status) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No expenses found</p>
          <p className="text-sm text-gray-400 mb-6">Create your first expense to start tracking</p>
          <Link href="/expenses/new">
            <Button className="bg-amber-500 hover:bg-amber-800">Add Expense</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-64"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={filters.categoryId || 'all'} onValueChange={(v) => handleFilter('category', v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.status || 'all'} onValueChange={(v) => handleFilter('status', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={handleBulkApprove} disabled={isPending}>
            <CheckCircle className="mr-1 h-4 w-4" /> Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={isPending}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.size === expenses.length && expenses.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Expense #</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">GST</TableHead>
              <TableHead className="text-right">Claimable GST</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(expense.id)}
                    onCheckedChange={() => toggleSelect(expense.id)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {new Date(expense.expenseDate).toLocaleDateString('en-IN')}
                </TableCell>
                <TableCell>
                  <Link href={`/expenses/${expense.id}`} className="text-amber-600 hover:underline font-medium">
                    {expense.expenseNumber}
                  </Link>
                </TableCell>
                <TableCell>{expense.categoryName}</TableCell>
                <TableCell className="max-w-48 truncate">{expense.description}</TableCell>
                <TableCell className="text-right">{fmt(expense.totalAmount)}</TableCell>
                <TableCell className="text-right">{fmt(expense.gstAmount)}</TableCell>
                <TableCell className="text-right">{fmt(expense.claimableGstAmount)}</TableCell>
                <TableCell>{statusBadge(expense.status)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/expenses/${expense.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </Link>
                      </DropdownMenuItem>
                      {expense.status === 'draft' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href={`/expenses/${expense.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              startTransition(async () => {
                                const formData = new FormData();
                                formData.set('id', expense.id);
                                const result = await approveExpense({}, formData);
                                if (result && 'error' in result) toast.error(result.error as string);
                                else toast.success('Expense approved');
                              });
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Approve
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                  No expenses match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
