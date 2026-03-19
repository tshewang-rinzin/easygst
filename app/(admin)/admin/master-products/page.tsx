'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  Store, 
  Tag,
  Settings,
  Upload
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { deleteMasterProduct } from '@/lib/master-products/actions';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface BusinessType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  businessTypeId: string;
}

interface MasterProduct {
  id: string;
  name: string;
  description?: string;
  defaultSku?: string;
  defaultBarcode?: string;
  defaultUnit: string;
  defaultGstRate: string;
  defaultTaxClassification: string;
  imageUrl?: string;
  businessTypeId: string;
  categoryId: string;
  businessTypeName: string;
  categoryName: string;
  createdAt: string;
}

export default function MasterProductsPage() {
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data: businessTypes } = useSWR<{ businessTypes: BusinessType[] }>(
    '/api/master-products/business-types',
    fetcher
  );

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: '50',
    ...(selectedBusinessType && { businessTypeId: selectedBusinessType }),
    ...(selectedCategory && { categoryId: selectedCategory }),
    ...(searchQuery && { search: searchQuery }),
  });

  const { data, isLoading } = useSWR<{
    products: MasterProduct[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/api/master-products?${queryParams}`, fetcher);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete master product "${name}"? This action cannot be undone.`)) return;
    
    const result = await deleteMasterProduct({ id }) as { success?: string; error?: string };
    if (result.success) {
      toast.success(result.success);
      mutate(`/api/master-products?${queryParams}`);
    } else {
      toast.error(result.error || 'Failed to delete product');
    }
  };

  const handleSearch = () => {
    setPage(1);
    mutate(`/api/master-products?${queryParams}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Product Catalog</h1>
          <p className="text-gray-500 mt-1">Manage the global product catalog for teams</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/master-products/business-types">
            <Button variant="outline">
              <Store className="h-4 w-4 mr-2" />
              Business Types
            </Button>
          </Link>
          <Link href="/admin/master-products/categories">
            <Button variant="outline">
              <Tag className="h-4 w-4 mr-2" />
              Categories
            </Button>
          </Link>
          <Link href="/admin/master-products/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </Link>
          <Link href="/admin/master-products/new">
            <Button className="bg-amber-500 hover:bg-amber-800">
              <Plus className="h-4 w-4 mr-2" />
              New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
                <SelectTrigger>
                  <SelectValue placeholder="All business types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All business types</SelectItem>
                  {businessTypes?.businessTypes.map((bt) => (
                    <SelectItem key={bt.id} value={bt.id}>
                      {bt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {/* Categories would be loaded based on business type */}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, SKU, or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} variant="outline">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Products</CardTitle>
            {data && (
              <p className="text-sm text-gray-500">
                Showing {data.products.length} of {data.pagination.total} products
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading products...</p>
            </div>
          ) : data?.products.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Start by creating your first master product</p>
              <Link href="/admin/master-products/new">
                <Button className="bg-amber-500 hover:bg-amber-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Product
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Business Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>GST Rate</TableHead>
                  <TableHead>Tax Class</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.description && (
                            <span className="block">{product.description}</span>
                          )}
                          {product.defaultSku && (
                            <span className="inline-block mr-4">SKU: {product.defaultSku}</span>
                          )}
                          {product.defaultBarcode && (
                            <span className="inline-block">Barcode: {product.defaultBarcode}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {product.businessTypeName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {product.categoryName}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{product.defaultUnit}</TableCell>
                    <TableCell className="font-medium">{product.defaultGstRate}%</TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          product.defaultTaxClassification === 'EXEMPT' ? 'bg-red-100 text-red-700' :
                          product.defaultTaxClassification === 'ZERO_RATED' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }
                      >
                        {product.defaultTaxClassification.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/master-products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-3 py-2 text-sm text-gray-600">
            Page {page} of {data.pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
            disabled={page === data.pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}