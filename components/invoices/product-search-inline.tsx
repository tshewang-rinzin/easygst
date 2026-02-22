'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';

interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unitPrice: string | null;
  costPrice: string | null;
  attributeValues: unknown;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unitPrice: string;
  unit: string;
  defaultTaxRate: string;
  isTaxExempt: boolean;
  variants?: ProductVariant[];
  variantId?: string;
  variantName?: string;
}

interface ProductSearchInlineProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (product: Product) => void;
  index: number;
  required?: boolean;
}

export function ProductSearchInline({
  value,
  onChange,
  onSelect,
  index,
  required = false,
}: ProductSearchInlineProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setIsOpen(data.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (product: Product) => {
    const displayName = product.variantName
      ? `${product.name} - ${product.variantName}`
      : product.name;
    setQuery(displayName);
    onChange(displayName);
    onSelect({
      ...product,
      name: displayName,
    });
    setIsOpen(false);
  };

  const handleVariantSelect = (product: Product, variant: ProductVariant) => {
    const displayName = `${product.name} - ${variant.name}`;
    const selectedProduct: Product = {
      ...product,
      name: displayName,
      unitPrice: variant.unitPrice || product.unitPrice,
      sku: variant.sku,
      variantId: variant.id,
      variantName: variant.name,
      variants: undefined,
    };
    setQuery(displayName);
    onChange(displayName);
    onSelect(selectedProduct);
    setIsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
  };

  const renderDropdown = () => {
    if (!isOpen) return null;

    const dropdown = (
      <>
        {results.length > 0 && (
          <div
            ref={dropdownRef}
            className="bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-auto"
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 9999,
            }}
          >
            {results.map((product) => {
              const hasVariants = product.variants && product.variants.length > 0;

              if (!hasVariants) {
                // Products without variants — same as before
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelect(product)}
                    className="w-full px-3 py-2 text-left hover:bg-orange-50 border-b last:border-b-0 transition-colors focus:bg-orange-50 focus:outline-none"
                  >
                    <div className="font-semibold text-sm text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {product.sku && <span className="mr-2">SKU: {product.sku}</span>}
                      <span>Price: {parseFloat(product.unitPrice).toFixed(2)}</span>
                      {product.description && (
                        <div className="text-xs text-gray-500 mt-1 truncate">{product.description}</div>
                      )}
                    </div>
                  </button>
                );
              }

              // Products with variants — show header + variant rows
              return (
                <div key={product.id} className="border-b last:border-b-0">
                  <div className="px-3 py-2 bg-gray-50">
                    <div className="font-semibold text-sm text-gray-900">{product.name}</div>
                    {product.sku && (
                      <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                    )}
                  </div>
                  {product.variants!.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleVariantSelect(product, variant)}
                      className="w-full pl-6 pr-3 py-1.5 text-left hover:bg-orange-50 transition-colors focus:bg-orange-50 focus:outline-none"
                    >
                      <div className="text-sm text-gray-700">
                        <span className="text-gray-400 mr-1">↳</span>
                        {variant.name}
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {variant.sku && <span className="mr-2">SKU: {variant.sku}</span>}
                        <span>
                          Price: {parseFloat(variant.unitPrice || product.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !isLoading && (
          <div
            ref={dropdownRef}
            className="bg-white border border-gray-200 rounded-lg shadow-2xl p-3 text-xs text-gray-500"
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 9999,
            }}
          >
            No products found. Enter manually or add product to catalog.
          </div>
        )}
      </>
    );

    return typeof window !== 'undefined' ? createPortal(dropdown, document.body) : null;
  };

  return (
    <>
      <div ref={wrapperRef} className="relative w-full">
        <Input
          type="text"
          placeholder="Search product..."
          value={query}
          onChange={handleChange}
          className="h-9 text-sm"
          autoComplete="off"
          name={`items.${index}.description`}
        />
      </div>
      {renderDropdown()}
    </>
  );
}
