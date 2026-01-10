'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
}

interface SupplierSearchProps {
  onSelect: (supplier: Supplier) => void;
  selectedSupplier: Supplier | null;
}

export function SupplierSearch({ onSelect, selectedSupplier }: SupplierSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Supplier[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchSuppliers = async () => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/suppliers/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchSuppliers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (supplier: Supplier) => {
    onSelect(supplier);
    setQuery(supplier.name);
    setIsOpen(false);
  };

  // Hide search field if supplier is already selected
  if (selectedSupplier) {
    return null;
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Label htmlFor="supplierSearch" className="text-sm font-medium text-gray-700 mb-2 block">
        Supplier <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="supplierSearch"
          type="text"
          placeholder="Search by name, email, or GST number..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          className="pl-10 bg-white"
          autoComplete="off"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((supplier) => (
            <button
              key={supplier.id}
              type="button"
              onClick={() => handleSelect(supplier)}
              className="w-full px-4 py-3 text-left hover:bg-orange-50 border-b last:border-b-0 transition-colors focus:bg-orange-50 focus:outline-none"
            >
              <div className="font-semibold text-gray-900 mb-1">{supplier.name}</div>
              <div className="text-sm text-gray-600">
                {supplier.gstNumber && <span>GST: {supplier.gstNumber}</span>}
                {supplier.gstNumber && supplier.email && <span className="mx-2">•</span>}
                {supplier.email && <span>{supplier.email}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-500">
          No suppliers found. Try a different search term.
        </div>
      )}
    </div>
  );
}
