'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Users, Building2, Receipt, Package } from 'lucide-react';

const EXPORT_ENTITIES = [
  {
    key: 'invoices',
    label: 'Invoices',
    description: 'All invoices with customer details, amounts, and payment status',
    icon: FileText,
  },
  {
    key: 'customers',
    label: 'Customers',
    description: 'Customer directory with contact information and TPN',
    icon: Users,
  },
  {
    key: 'suppliers',
    label: 'Suppliers',
    description: 'Supplier directory with contact information and TPN',
    icon: Building2,
  },
  {
    key: 'bills',
    label: 'Supplier Bills',
    description: 'All purchase bills with supplier details and payment status',
    icon: Receipt,
  },
  {
    key: 'payments',
    label: 'Customer Payments',
    description: 'Payment records with receipt numbers and allocation details',
    icon: Download,
  },
  {
    key: 'products',
    label: 'Products & Services',
    description: 'Product catalog with prices, tax rates, and categories',
    icon: Package,
  },
];

export default function DataExportPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (entity: string) => {
    setDownloading(entity);
    try {
      const response = await fetch(`/api/export/${entity}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">Data Export</h1>
          <p className="text-sm text-gray-500">
            Export your business data as CSV files for backup or analysis
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {EXPORT_ENTITIES.map((entity) => {
            const Icon = entity.icon;
            const isDownloading = downloading === entity.key;

            return (
              <Card key={entity.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{entity.label}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {entity.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleExport(entity.key)}
                    disabled={isDownloading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloading ? 'Exporting...' : 'Export CSV'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
