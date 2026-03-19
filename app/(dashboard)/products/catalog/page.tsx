'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Search, 
  Package, 
  ShoppingCart,
  Plus,
  Minus,
  Check,
  X,
  Grid3X3,
  List,
  Filter
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { addMasterProductsToTeam } from '@/lib/master-products/actions';
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
}

interface SelectedProduct {
  masterProductId: string;
  name: string;
  defaultUnit: string;
  sellingPrice: number;
  openingStock: number;
}

export default function ProductCatalogPage() {
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productDetails, setProductDetails] = useState<Record<string, SelectedProduct>>({});
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const { data: businessTypes } = useSWR<{ businessTypes: BusinessType[] }>(
    '/api/master-products/business-types',
    fetcher
  );

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: '24',
    ...(selectedBusinessType && { businessTypeId: selectedBusinessType }),
    ...(selectedCategory && { categoryId: selectedCategory }),
    ...(searchQuery && { search: searchQuery }),
  });

  const { data, isLoading } = useSWR<{
    products: MasterProduct[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/api/master-products?${queryParams}`, fetcher);

  const handleSearch = () => {
    setPage(1);
    mutate(`/api/master-products?${queryParams}`);
  };

  const toggleProductSelection = (productId: string, product: MasterProduct) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
      setProductDetails(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } else {
      setSelectedProducts(prev => [...prev, productId]);
      setProductDetails(prev => ({
        ...prev,
        [productId]: {
          masterProductId: productId,
          name: product.name,
          defaultUnit: product.defaultUnit,
          sellingPrice: 0,
          openingStock: 0,
        },
      }));
    }
  };

  const updateProductDetails = (productId: string, field: 'sellingPrice' | 'openingStock', value: number) => {
    setProductDetails(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleAddProducts = async () => {
    const products = selectedProducts.map(id => productDetails[id]).filter(p => p.sellingPrice > 0);
    
    if (products.length === 0) {
      toast.error('Please set selling prices for selected products');
      return;
    }

    setIsAdding(true);
    const result = await addMasterProductsToTeam({
      masterProductIds: selectedProducts,
      products,
    }) as { success?: string; error?: string };

    if (result.success) {
      toast.success(result.success);
      setSelectedProducts([]);
      setProductDetails({});
      setShowAddSheet(false);
    } else {
      toast.error(result.error || 'Failed to add products');
    }
    setIsAdding(false);
  };

  const selectedProductsList = selectedProducts.map(id => productDetails[id]).filter(Boolean);
  const canAddProducts = selectedProductsList.every(p => p.sellingPrice > 0);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            Product Catalog
          </h1>
          <p className="text-sm text-gray-500">
            Browse and add products from our master catalog
          </p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
              <SheetTrigger asChild>
                <Button className="bg-amber-500 hover:bg-amber-800">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add Selected ({selectedProducts.length})
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Add Selected Products</SheetTitle>
                  <SheetDescription>
                    Set selling prices and opening stock for your selected products
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  {selectedProductsList.map((product) => (
                    <Card key={product.masterProductId}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-500">Unit: {product.defaultUnit}</p>
                          </div>
                          
                          <div>
                            <Label htmlFor={`price-${product.masterProductId}`}>
                              Selling Price * (BTN)
                            </Label>
                            <Input
                              id={`price-${product.masterProductId}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={product.sellingPrice || ''}
                              onChange={(e) => updateProductDetails(
                                product.masterProductId,
                                'sellingPrice',
                                parseFloat(e.target.value) || 0
                              )}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`stock-${product.masterProductId}`}>
                              Opening Stock
                            </Label>
                            <Input
                              id={`stock-${product.masterProductId}`}
                              type="number"
                              min="0"
                              value={product.openingStock || ''}
                              onChange={(e) => updateProductDetails(
                                product.masterProductId,
                                'openingStock',
                                parseInt(e.target.value) || 0
                              )}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowAddSheet(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-amber-500 hover:bg-amber-800"
                      onClick={handleAddProducts}
                      disabled={!canAddProducts || isAdding}
                    >
                      {isAdding ? 'Adding...' : `Add ${selectedProducts.length} Products`}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
                <SelectTrigger>
                  <SelectValue placeholder="All business types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All business types</SelectItem>
                  {businessTypes?.businessTypes.map((bt) => (
                    <SelectItem key={bt.id} value={bt.id}>
                      {bt.icon} {bt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <div>
              {selectedProducts.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProducts([]);
                    setProductDetails({});
                  }}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear ({selectedProducts.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading products...</p>
        </div>
      ) : data?.products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm leading-tight mb-1">{product.name}</h3>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {product.businessTypeName}
                      </Badge>
                      <p className="text-xs text-gray-500">{product.categoryName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleProductSelection(product.id, product)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      selectedProducts.includes(product.id)
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'border-gray-300 hover:border-amber-300'
                    }`}
                  >
                    {selectedProducts.includes(product.id) && <Check className="h-3 w-3" />}
                  </button>
                </div>

                {product.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                )}

                <div className="space-y-1 text-xs text-gray-500">
                  <div>Unit: {product.defaultUnit}</div>
                  {product.defaultSku && <div>SKU: {product.defaultSku}</div>}
                  <div className="flex items-center justify-between">
                    <span>GST: {product.defaultGstRate}%</span>
                    <Badge className="text-xs">{product.defaultTaxClassification}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-0">
              {data?.products.map((product) => (
                <div key={product.id} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleProductSelection(product.id, product)}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-1 ${
                            selectedProducts.includes(product.id)
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-gray-300 hover:border-amber-300'
                          }`}
                        >
                          {selectedProducts.includes(product.id) && <Check className="h-3 w-3" />}
                        </button>
                        
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{product.name}</h3>
                          {product.description && (
                            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 text-sm">
                            <Badge variant="outline">{product.businessTypeName}</Badge>
                            <span className="text-gray-500">{product.categoryName}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">Unit: {product.defaultUnit}</span>
                            {product.defaultSku && (
                              <>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-500">SKU: {product.defaultSku}</span>
                              </>
                            )}
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">GST: {product.defaultGstRate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
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
    </section>
  );
}