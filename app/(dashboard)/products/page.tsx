import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, Tag, Eye, Edit, Package, Briefcase } from 'lucide-react';
import { getProducts } from '@/lib/products/queries';
import { getGSTClassificationLabel, getGSTClassificationColor } from '@/lib/invoices/gst-classification';

async function ProductList({ searchTerm }: { searchTerm?: string }) {
  const products = await getProducts(searchTerm);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <PlusCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No products yet
        </h3>
        <p className="text-gray-500 mb-4">
          Get started by adding your first product or service
        </p>
        <Link href="/products/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name / SKU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Tax Rate</TableHead>
              <TableHead>GST Classification</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {product.name}
                      {Number(product.variantCount) > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200">
                          {product.variantCount} variant{Number(product.variantCount) !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {product.sku && (
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <Tag className="h-3 w-3 mr-1" />
                        {product.sku}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {product.productType === 'service' ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Briefcase className="h-3 w-3 mr-1" />
                      Service
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Package className="h-3 w-3 mr-1" />
                      Product
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {product.description || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{product.unit}</TableCell>
                <TableCell className="text-right font-medium">
                  BTN {parseFloat(product.unitPrice).toFixed(2)}
                </TableCell>
                <TableCell>
                  {product.isTaxExempt ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Tax Exempt
                    </Badge>
                  ) : (
                    <span className="font-medium">{parseFloat(product.defaultTaxRate)}%</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getGSTClassificationColor(product.gstClassification as any)}>
                    {getGSTClassificationLabel(product.gstClassification as any)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {product.category ? (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/products/${product.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/products/${product.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ProductListSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name / SKU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Tax Rate</TableHead>
              <TableHead>GST Classification</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-8 bg-gray-200 rounded w-16 ml-auto"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const searchTerm = params.search;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Products & Services
          </h1>
          <p className="text-sm text-gray-500">
            Manage your product catalog and pricing
          </p>
        </div>
        <Link href="/products/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form action="/products" method="get" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Search by name, SKU, or description..."
                defaultValue={searchTerm}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList searchTerm={searchTerm} />
      </Suspense>
    </section>
  );
}
