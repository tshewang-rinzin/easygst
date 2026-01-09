'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;
  currency: string;
  status?: string;
  paymentStatus?: string;
}

interface SearchableInvoiceSelectProps {
  invoices: Invoice[];
  selectedInvoiceId: number | null;
  onSelectInvoice: (invoiceId: number | null) => void;
  excludedInvoiceIds?: number[];
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function SearchableInvoiceSelect({
  invoices,
  selectedInvoiceId,
  onSelectInvoice,
  excludedInvoiceIds = [],
  label = 'Select Invoice',
  placeholder = 'Search for an invoice...',
  required = false,
}: SearchableInvoiceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  // Filter out excluded invoices and search
  const availableInvoices = invoices.filter(
    (inv) => !excludedInvoiceIds.includes(inv.id)
  );

  const filteredInvoices = availableInvoices.filter((invoice) => {
    const search = searchTerm.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(search) ||
      invoice.amountDue.includes(search) ||
      new Date(invoice.invoiceDate).toLocaleDateString().toLowerCase().includes(search)
    );
  });

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
          prev < filteredInvoices.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredInvoices[highlightedIndex]) {
          handleSelectInvoice(filteredInvoices[highlightedIndex].id);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelectInvoice = (invoiceId: number) => {
    onSelectInvoice(invoiceId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onSelectInvoice(null);
    setSearchTerm('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <Label htmlFor="invoice-search" className="mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      {/* Selected Invoice Display or Search Input */}
      <div className="relative">
        {selectedInvoice && !isOpen ? (
          <div
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer hover:border-orange-400 transition-colors"
            onClick={() => setIsOpen(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{selectedInvoice.invoiceNumber}</span>
                  {isOverdue(selectedInvoice.dueDate) && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      Overdue
                    </span>
                  )}
                </div>
                <div className="flex gap-3 text-xs text-gray-500 mt-1">
                  <span>Due: {formatDate(selectedInvoice.dueDate)}</span>
                  <span className="font-semibold text-orange-600">
                    {selectedInvoice.currency} {parseFloat(selectedInvoice.amountDue).toFixed(2)} due
                  </span>
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
              id="invoice-search"
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-72 overflow-auto">
          {filteredInvoices.length > 0 ? (
            <ul className="py-1">
              {filteredInvoices.map((invoice, index) => {
                const overdueStatus = isOverdue(invoice.dueDate);
                return (
                  <li
                    key={invoice.id}
                    className={`px-3 py-2 cursor-pointer transition-colors ${
                      index === highlightedIndex
                        ? 'bg-orange-50 text-orange-900'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectInvoice(invoice.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                          {overdueStatus && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 text-xs text-gray-600 mt-1.5">
                          <div className="flex gap-3">
                            <span>📅 Issued: {formatDate(invoice.invoiceDate)}</span>
                            <span className={overdueStatus ? 'text-red-600 font-medium' : ''}>
                              Due: {formatDate(invoice.dueDate)}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <span>Total: {invoice.currency} {parseFloat(invoice.totalAmount).toFixed(2)}</span>
                            <span className="font-semibold text-orange-600">
                              Due: {invoice.currency} {parseFloat(invoice.amountDue).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {selectedInvoiceId === invoice.id && (
                        <Check className="h-4 w-4 text-orange-500 ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-3 py-8 text-center text-gray-500">
              <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="mb-2">No invoices found</p>
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
              {filteredInvoices.length === 0 && availableInvoices.length === 0 && (
                <p className="text-sm mt-2">
                  All invoices have been allocated
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
