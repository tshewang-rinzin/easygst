/**
 * CSV generation utilities for data export
 */

/**
 * Escape a value for CSV - handles commas, quotes, and newlines
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of objects to CSV string
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; header: string }[]
): string {
  const headers = columns.map((c) => escapeCSV(c.header)).join(',');
  const rows = data.map((row) =>
    columns.map((c) => escapeCSV(row[c.key])).join(',')
  );
  return [headers, ...rows].join('\n');
}

/**
 * Column definitions for exportable entities
 */
export const EXPORT_COLUMNS = {
  invoices: [
    { key: 'invoiceNumber', header: 'Invoice Number' },
    { key: 'invoiceDate', header: 'Invoice Date' },
    { key: 'dueDate', header: 'Due Date' },
    { key: 'customerName', header: 'Customer' },
    { key: 'customerTpn', header: 'Customer TPN' },
    { key: 'status', header: 'Status' },
    { key: 'paymentStatus', header: 'Payment Status' },
    { key: 'currency', header: 'Currency' },
    { key: 'subtotal', header: 'Subtotal' },
    { key: 'totalTax', header: 'Total Tax' },
    { key: 'totalDiscount', header: 'Total Discount' },
    { key: 'totalAmount', header: 'Total Amount' },
    { key: 'amountPaid', header: 'Amount Paid' },
    { key: 'amountDue', header: 'Amount Due' },
  ],
  customers: [
    { key: 'name', header: 'Name' },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'tpn', header: 'TPN' },
    { key: 'address', header: 'Address' },
    { key: 'city', header: 'City' },
    { key: 'dzongkhag', header: 'Dzongkhag' },
    { key: 'createdAt', header: 'Created' },
  ],
  suppliers: [
    { key: 'name', header: 'Name' },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'tpn', header: 'TPN' },
    { key: 'gstNumber', header: 'GST Number' },
    { key: 'address', header: 'Address' },
    { key: 'city', header: 'City' },
    { key: 'dzongkhag', header: 'Dzongkhag' },
    { key: 'createdAt', header: 'Created' },
  ],
  bills: [
    { key: 'billNumber', header: 'Bill Number' },
    { key: 'billDate', header: 'Bill Date' },
    { key: 'dueDate', header: 'Due Date' },
    { key: 'supplierName', header: 'Supplier' },
    { key: 'supplierTpn', header: 'Supplier TPN' },
    { key: 'status', header: 'Status' },
    { key: 'paymentStatus', header: 'Payment Status' },
    { key: 'currency', header: 'Currency' },
    { key: 'subtotal', header: 'Subtotal' },
    { key: 'totalTax', header: 'Total Tax' },
    { key: 'totalDiscount', header: 'Total Discount' },
    { key: 'totalAmount', header: 'Total Amount' },
    { key: 'amountPaid', header: 'Amount Paid' },
    { key: 'amountDue', header: 'Amount Due' },
  ],
  payments: [
    { key: 'receiptNumber', header: 'Receipt Number' },
    { key: 'paymentDate', header: 'Payment Date' },
    { key: 'customerName', header: 'Customer' },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'paymentMethod', header: 'Payment Method' },
    { key: 'transactionId', header: 'Transaction ID' },
    { key: 'allocatedAmount', header: 'Allocated Amount' },
    { key: 'unallocatedAmount', header: 'Unallocated Amount' },
  ],
  products: [
    { key: 'name', header: 'Name' },
    { key: 'sku', header: 'SKU' },
    { key: 'description', header: 'Description' },
    { key: 'unitPrice', header: 'Unit Price' },
    { key: 'unit', header: 'Unit' },
    { key: 'defaultTaxRate', header: 'Tax Rate (%)' },
    { key: 'categoryName', header: 'Category' },
    { key: 'isActive', header: 'Active' },
  ],
} as const;

export type ExportEntity = keyof typeof EXPORT_COLUMNS;
