'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Customer {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  tpn?: string;
}

interface SearchableCustomerSelectProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function SearchableCustomerSelect({
  customers,
  selectedCustomer,
  onSelectCustomer,
  label = 'Select Customer',
  placeholder = 'Search for a customer...',
  required = false,
}: SearchableCustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter customers based on search term
  const filteredCustomers = customers?.filter((customer) => {
    const search = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.mobile?.toLowerCase().includes(search) ||
      customer.tpn?.toLowerCase().includes(search)
    );
  }) || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCustomers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCustomers[highlightedIndex]) {
          handleSelectCustomer(filteredCustomers[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onSelectCustomer(null);
    setSearchTerm('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <Label htmlFor="customer-search" className="mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      {/* Selected Customer Display or Search Input */}
      <div className="relative">
        {selectedCustomer && !isOpen ? (
          <div
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer hover:border-orange-400 transition-colors"
            onClick={() => setIsOpen(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
                <div className="flex gap-3 text-xs text-gray-500 mt-1">
                  {selectedCustomer.email && <span>{selectedCustomer.email}</span>}
                  {selectedCustomer.mobile && <span>{selectedCustomer.mobile}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="text-gray-400 hover:text-gray-600 px-1"
                >
                  ✕
                </button>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              id="customer-search"
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoComplete="off"
            />
            <ChevronDown
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        )}
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredCustomers.length > 0 ? (
            <ul className="py-1">
              {filteredCustomers.map((customer, index) => (
                <li
                  key={customer.id}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    index === highlightedIndex
                      ? 'bg-orange-50 text-orange-900'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectCustomer(customer)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        {customer.email && <span>📧 {customer.email}</span>}
                        {customer.mobile && <span>📱 {customer.mobile}</span>}
                        {customer.tpn && <span>🏢 TPN: {customer.tpn}</span>}
                      </div>
                    </div>
                    {selectedCustomer?.id === customer.id && (
                      <Check className="h-4 w-4 text-orange-500 ml-2 flex-shrink-0" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-8 text-center text-gray-500">
              <p className="mb-2">No customers found</p>
              {searchTerm && (
                <p className="text-sm">
                  Try adjusting your search term or{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setIsOpen(false);
                    }}
                    className="text-orange-600 hover:text-orange-700 underline"
                  >
                    clear search
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Add New Customer Link */}
          <div className="border-t border-gray-200 p-2">
            <a
              href="/customers/new"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors text-center"
            >
              + Add New Customer
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
