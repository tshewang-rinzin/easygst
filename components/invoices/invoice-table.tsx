'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Eye,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { bulkUpdateInvoiceStatus, bulkDeleteInvoices } from '@/lib/invoices/bulk-actions';

type InvoiceRow = {
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date | null;
    totalAmount: string;
    amountDue: string;
    currency: string;
    status: string;
    customerId: string | null;
  };
  customer: {
    id: string;
    name: string;
  } | null;
};

export function InvoiceTable({ invoices }: { invoices: InvoiceRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const allSelected = invoices.length > 0 && selected.size === invoices.length;
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(invoices.map((r) => r.invoice.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectedInvoices = invoices.filter((r) => selected.has(r.invoice.id));
  const allDraft = selectedInvoices.every((r) => r.invoice.status === 'draft');
  const allSentOrViewed = selectedInvoices.every(
    (r) => r.invoice.status === 'sent' || r.invoice.status === 'viewed'
  );
  const noPaid = selectedInvoices.every((r) => r.invoice.status !== 'paid');

  const runAction = (action: () => Promise<any>) => {
    startTransition(async () => {
      const result = await action();
      if (result && 'error' in result && result.error) {
        toast.error(result.error);
      } else if (result && 'success' in result && result.success) {
        toast.success(result.success);
        setSelected(new Set());
        router.refresh();
      }
    });
  };

  const ids = Array.from(selected);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Amount Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(({ invoice, customer }) => (
              <TableRow
                key={invoice.id}
                className={selected.has(invoice.id) ? 'bg-amber-50' : ''}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(invoice.id)}
                    onCheckedChange={() => toggle(invoice.id)}
                    aria-label={`Select ${invoice.invoiceNumber}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>{customer?.name || 'N/A'}</TableCell>
                <TableCell>
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {invoice.currency}{' '}
                  {parseFloat(invoice.totalAmount).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      parseFloat(invoice.amountDue) > 0
                        ? 'text-red-600 font-medium'
                        : 'text-gray-600'
                    }
                  >
                    {invoice.currency}{' '}
                    {parseFloat(invoice.amountDue).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      invoice.status === 'paid'
                        ? 'default'
                        : invoice.status === 'draft'
                        ? 'secondary'
                        : invoice.status === 'overdue'
                        ? 'destructive'
                        : 'outline'
                    }
                    className={
                      invoice.status === 'sent'
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                        : invoice.status === 'viewed'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                        : invoice.status === 'paid'
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : ''
                    }
                  >
                    {invoice.status.charAt(0).toUpperCase() +
                      invoice.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/invoices/${invoice.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {invoice.status === 'draft' && (
                      <Link href={`/invoices/${invoice.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="sticky bottom-0 border-t bg-white p-3 flex flex-wrap items-center gap-2 shadow-lg rounded-b-lg z-10">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}
          <span className="text-sm font-medium text-gray-700">
            {selected.size} selected
          </span>
          <div className="flex-1" />

          {allDraft && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                runAction(() =>
                  bulkUpdateInvoiceStatus({ ids, status: 'sent' })
                )
              }
            >
              <Send className="h-4 w-4 mr-1" />
              Mark as Sent
            </Button>
          )}

          {allSentOrViewed && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                runAction(() =>
                  bulkUpdateInvoiceStatus({ ids, status: 'paid' })
                )
              }
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark as Paid
            </Button>
          )}

          {noPaid && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                runAction(() =>
                  bulkUpdateInvoiceStatus({ ids, status: 'cancelled' })
                )
              }
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}

          {allDraft && (
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={() => runAction(() => bulkDeleteInvoices({ ids }))}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => setSelected(new Set())}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}
    </Card>
  );
}
