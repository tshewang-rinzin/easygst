'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hash, Save, AlertCircle, FileText, ShoppingCart, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import useSWR from 'swr';
import { updateTeam } from '@/lib/teams/actions';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DocumentNumberingPage() {
  const router = useRouter();
  const { data: team, mutate } = useSWR('/api/team', fetcher);

  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Set initial values when team data loads
  useEffect(() => {
    if (team?.invoicePrefix) {
      setInvoicePrefix(team.invoicePrefix);
    }
  }, [team]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await updateTeam({
        invoicePrefix: invoicePrefix || 'INV',
      });

      if ('success' in result && result.success) {
        setMessage({ type: 'success', text: 'Document numbering settings saved successfully' });
        mutate();
        router.refresh();
      } else {
        setMessage({ type: 'error', text: ('message' in result && result.message) || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const numberingFormats = [
    {
      type: 'Invoice',
      icon: FileText,
      format: `${invoicePrefix || 'INV'}-YYYY-NNNN`,
      example: `${invoicePrefix || 'INV'}-2026-0001`,
      description: 'Sales invoices and credit notes',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      type: 'Bill',
      icon: ShoppingCart,
      format: 'BILL-YYYY-NNNN',
      example: 'BILL-2026-0001',
      description: 'Supplier bills and purchase records',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      type: 'Customer Advance',
      icon: ArrowDownCircle,
      format: 'ADV-C-YYYY-NNNN',
      example: 'ADV-C-2026-0001',
      description: 'Prepayments received from customers',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      type: 'Supplier Advance',
      icon: ArrowUpCircle,
      format: 'ADV-S-YYYY-NNNN',
      example: 'ADV-S-2026-0001',
      description: 'Prepayments made to suppliers',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Document Numbering</h1>
        <p className="text-muted-foreground">
          Configure automatic numbering formats for invoices, bills, and advances
        </p>
      </div>

      {message && (
        <Card className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <CardContent className="pt-6">
            <p className={message.type === 'success' ? 'text-green-900' : 'text-red-900'}>
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invoice Prefix Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Prefix
          </CardTitle>
          <CardDescription>
            Customize the prefix for invoice numbers. Default is "INV"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Invoice Prefix</label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
              placeholder="INV"
              maxLength={20}
              className="w-full max-w-xs px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Example: {invoicePrefix || 'INV'}-2026-0001
            </p>
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Current Numbering Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Current Numbering Formats
          </CardTitle>
          <CardDescription>
            Automatic numbering formats for all document types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {numberingFormats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.type} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className={`p-3 ${item.bgColor} rounded-lg`}>
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.type}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono">
                        {item.format}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Example:</span>
                      <Badge className={item.bgColor + ' ' + item.color + ' font-mono'}>
                        {item.example}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Numbering Rules */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Numbering Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p><strong>Gap-Free Sequencing:</strong> All numbers are sequential with no gaps, ensuring audit compliance</p>
          <p><strong>Year-Based Reset:</strong> Counters reset to 0001 at the start of each year</p>
          <p><strong>Concurrency Safe:</strong> Prevents duplicate numbers even with multiple users</p>
          <p><strong>Format Structure:</strong></p>
          <ul className="ml-6 space-y-1 list-disc">
            <li><code>PREFIX</code> - Configurable prefix (e.g., INV, BILL, ADV-C)</li>
            <li><code>YYYY</code> - Four-digit year (e.g., 2026)</li>
            <li><code>NNNN</code> - Four-digit sequential number (e.g., 0001, 0002)</li>
          </ul>
          <p className="mt-4"><strong>Important:</strong> Changing the invoice prefix will apply to all new invoices. Existing invoices keep their original numbers.</p>
        </CardContent>
      </Card>

      {/* Technical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Technical Details
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <h4 className="font-semibold mb-1">Invoice Numbering</h4>
            <p className="text-muted-foreground">
              Generated from <code className="bg-muted px-1 py-0.5 rounded">invoice_sequences</code> table.
              Supports custom prefix per team. Reset annually.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Bill Numbering</h4>
            <p className="text-muted-foreground">
              Generated from <code className="bg-muted px-1 py-0.5 rounded">supplier_bill_sequences</code> table.
              Fixed "BILL" prefix. Reset annually.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Advance Numbering</h4>
            <p className="text-muted-foreground">
              Customer advances use <code className="bg-muted px-1 py-0.5 rounded">customer_advance_sequences</code> (ADV-C prefix).
              Supplier advances use <code className="bg-muted px-1 py-0.5 rounded">supplier_advance_sequences</code> (ADV-S prefix).
              Both reset annually.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
