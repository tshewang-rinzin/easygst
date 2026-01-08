import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, Tag } from 'lucide-react';
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Link key={product.id} href={`/products/${product.id}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              {product.sku && (
                <div className="flex items-center text-sm text-gray-500">
                  <Tag className="h-3 w-3 mr-1" />
                  SKU: {product.sku}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {product.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-lg font-semibold text-gray-900">
                    BTN {parseFloat(product.unitPrice).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">per {product.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Tax Rate</p>
                  {product.isTaxExempt ? (
                    <span className="text-sm font-medium text-green-600">
                      Tax Exempt
                    </span>
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">
                      {parseFloat(product.defaultTaxRate)}%
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-2">
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getGSTClassificationColor(product.gstClassification as any)}`}>
                  {getGSTClassificationLabel(product.gstClassification as any)}
                </span>
              </div>
              {product.category && (
                <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block">
                  {product.category}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </CardContent>
        </Card>
      ))}
    </div>
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
