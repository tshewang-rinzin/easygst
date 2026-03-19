'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Download,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useSWR from 'swr';
import { importMasterProducts } from '@/lib/master-products/actions';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface BusinessType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

const csvTemplate = `name,description,sku,barcode,unit,gstRate,category,businessType
Rice (5kg),Basmati Rice 5kg bag,GRC-001,8901234567890,pcs,0,Staples,grocery
Cooking Oil (1L),Refined Sunflower Oil 1L,GRC-002,8901234567891,bottle,0,Cooking Essentials,grocery
Dal (1kg),Moong Dal 1kg pack,GRC-003,8901234567892,kg,0,Pulses,grocery
Bread,Fresh White Bread,GRC-004,8901234567893,loaf,0,Bakery,grocery
Milk (1L),Fresh Cow Milk 1L,GRC-005,8901234567894,liter,0,Dairy,grocery`;

export default function ImportMasterProductsPage() {
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('');
  const [csvData, setCsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const { data: businessTypes } = useSWR<{ businessTypes: BusinessType[] }>(
    '/api/admin/business-types',
    fetcher
  );

  const handlePreview = () => {
    if (!csvData.trim()) {
      toast.error('Please paste CSV data');
      return;
    }

    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1, 6); // Preview first 5 rows

      const preview = dataRows.map(row => {
        const values = row.split(',').map(v => v.trim());
        const item: any = {};
        headers.forEach((header, i) => {
          item[header] = values[i] || '';
        });
        return item;
      });

      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      toast.error('Invalid CSV format');
    }
  };

  const handleImport = async () => {
    if (!selectedBusinessType) {
      toast.error('Please select a business type');
      return;
    }

    if (!csvData.trim()) {
      toast.error('Please paste CSV data');
      return;
    }

    setIsImporting(true);
    const result = await importMasterProducts({
      csvData: csvData.trim(),
      businessTypeId: selectedBusinessType,
    }) as { success?: string; error?: string };

    if (result.success) {
      toast.success(result.success);
      setCsvData('');
      setPreviewData([]);
      setShowPreview(false);
    } else {
      toast.error(result.error || 'Import failed');
    }
    setIsImporting(false);
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'master_products_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/master-products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Master Products</h1>
          <p className="text-gray-500 mt-1">Bulk import products from CSV</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV Import</CardTitle>
              <CardDescription>
                Upload products in bulk using CSV format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes?.businessTypes.map((bt) => (
                      <SelectItem key={bt.id} value={bt.id}>
                        {bt.icon} {bt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="csvData">CSV Data *</Label>
                <Textarea
                  id="csvData"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Paste your CSV data here..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  First row should contain headers: name,description,sku,barcode,unit,gstRate,category
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handlePreview} 
                  variant="outline"
                  disabled={!csvData.trim()}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={!selectedBusinessType || !csvData.trim() || isImporting}
                  className="bg-amber-500 hover:bg-amber-800"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Products'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle>CSV Template</CardTitle>
              <CardDescription>
                Download a sample CSV file to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* Format Guide */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>CSV Format Requirements:</strong>
              <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                <li><strong>name</strong> (required): Product name</li>
                <li><strong>description</strong> (optional): Product description</li>
                <li><strong>sku</strong> (optional): Stock keeping unit code</li>
                <li><strong>barcode</strong> (optional): Product barcode</li>
                <li><strong>unit</strong> (optional): Unit of measure (default: piece)</li>
                <li><strong>gstRate</strong> (optional): GST rate percentage (default: 0)</li>
                <li><strong>category</strong> (required): Category name (will be created if doesn't exist)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        {/* Preview */}
        <div>
          {showPreview && previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  First {previewData.length} rows from your CSV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(previewData[0] || {}).map(header => (
                          <th key={header} className="text-left p-2 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-b">
                          {Object.values(row).map((value: any, cellIndex) => (
                            <td key={cellIndex} className="p-2 text-gray-600">
                              {value || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>CSV format looks good! Ready to import.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <strong>Select Business Type:</strong> Choose the business category for these products
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <strong>Prepare CSV:</strong> Use the template or format your data with required headers
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <strong>Paste Data:</strong> Copy and paste your CSV content into the text area
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <strong>Preview:</strong> Check the preview to ensure data looks correct
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</div>
                <div>
                  <strong>Import:</strong> Click import to add products to the catalog
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}