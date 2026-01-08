'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

interface CustomerSearchProps {
  onSelect: (customer: Customer) => void;
  selectedCustomer: Customer | null;
}

export function CustomerSearch({ onSelect, selectedCustomer }: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
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
    const searchCustomers = async () => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
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

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setQuery(customer.name);
    setIsOpen(false);
  };

  // Hide search field if customer is already selected
  if (selectedCustomer) {
    return null;
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Label htmlFor="customerSearch" className="text-sm font-medium text-gray-700 mb-2 block">
        Customer <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="customerSearch"
          type="text"
          placeholder="Search by name, email, or phone..."
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
          {results.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => handleSelect(customer)}
              className="w-full px-4 py-3 text-left hover:bg-orange-50 border-b last:border-b-0 transition-colors focus:bg-orange-50 focus:outline-none"
            >
              <div className="font-semibold text-gray-900 mb-1">{customer.name}</div>
              <div className="text-sm text-gray-600">
                {customer.email && <span>{customer.email}</span>}
                {customer.email && customer.phone && <span className="mx-2">•</span>}
                {customer.phone && <span>{customer.phone}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-500">
          No customers found. Try a different search term.
        </div>
      )}
    </div>
  );
}
