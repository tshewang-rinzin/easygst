import { describe, it, expect } from 'vitest';
import {
  calculateLineItem,
  calculateInvoiceTotals,
  calculateAmountDue,
  determinePaymentStatus,
} from './calculations';

describe('calculateLineItem', () => {
  it('calculates basic line item (no discount, standard tax)', () => {
    const result = calculateLineItem({
      quantity: 2,
      unitPrice: 100,
      taxRate: 12,
      isTaxExempt: false,
    });
    expect(result.subtotal).toBe('200.00');
    expect(result.discountAmount).toBe('0.00');
    expect(result.taxAmount).toBe('24.00');
    expect(result.itemTotal).toBe('224.00');
  });

  it('calculates with discount', () => {
    const result = calculateLineItem({
      quantity: 5,
      unitPrice: 200,
      discountPercent: 10,
      taxRate: 12,
      isTaxExempt: false,
    });
    expect(result.subtotal).toBe('1000.00');
    expect(result.discountAmount).toBe('100.00');
    // Tax on 900 (after discount): 900 * 12% = 108
    expect(result.taxAmount).toBe('108.00');
    expect(result.itemTotal).toBe('1008.00');
  });

  it('handles tax-exempt items', () => {
    const result = calculateLineItem({
      quantity: 3,
      unitPrice: 150,
      taxRate: 12,
      isTaxExempt: true,
    });
    expect(result.subtotal).toBe('450.00');
    expect(result.taxAmount).toBe('0.00');
    expect(result.itemTotal).toBe('450.00');
  });

  it('handles decimal quantities and prices', () => {
    const result = calculateLineItem({
      quantity: 1.5,
      unitPrice: 33.33,
      taxRate: 5,
      isTaxExempt: false,
    });
    // 1.5 * 33.33 = 49.995 -> displayed as 50.00
    expect(result.subtotal).toBe('50.00');
    // Tax: 49.995 * 5% = 2.49975 -> 2.50
    expect(result.taxAmount).toBe('2.50');
    // Total: 49.995 + 2.49975 = 52.49475 -> 52.49
    expect(result.itemTotal).toBe('52.49');
  });

  it('handles zero quantity', () => {
    const result = calculateLineItem({
      quantity: 0,
      unitPrice: 100,
      taxRate: 12,
      isTaxExempt: false,
    });
    expect(result.subtotal).toBe('0.00');
    expect(result.taxAmount).toBe('0.00');
    expect(result.itemTotal).toBe('0.00');
  });
});

describe('calculateInvoiceTotals', () => {
  it('calculates totals for multiple items', () => {
    const result = calculateInvoiceTotals([
      { quantity: 2, unitPrice: 100, taxRate: 12, isTaxExempt: false },
      { quantity: 1, unitPrice: 500, taxRate: 12, isTaxExempt: false },
    ]);
    // Item 1: subtotal 200, tax 24
    // Item 2: subtotal 500, tax 60
    expect(result.subtotal).toBe('700.00');
    expect(result.totalDiscount).toBe('0.00');
    expect(result.totalTax).toBe('84.00');
    expect(result.totalAmount).toBe('784.00');
  });

  it('calculates tax breakdown by rate', () => {
    const result = calculateInvoiceTotals([
      { quantity: 1, unitPrice: 100, taxRate: 12, isTaxExempt: false },
      { quantity: 1, unitPrice: 200, taxRate: 5, isTaxExempt: false },
      { quantity: 1, unitPrice: 300, taxRate: 12, isTaxExempt: false },
    ]);

    expect(result.taxBreakdown).toHaveLength(2);

    const rate5 = result.taxBreakdown.find((b) => b.rate === '5');
    const rate12 = result.taxBreakdown.find((b) => b.rate === '12');

    expect(rate5?.taxableAmount).toBe('200.00');
    expect(rate5?.taxAmount).toBe('10.00');
    expect(rate12?.taxableAmount).toBe('400.00');
    expect(rate12?.taxAmount).toBe('48.00');
  });

  it('handles mix of taxable and exempt items', () => {
    const result = calculateInvoiceTotals([
      { quantity: 1, unitPrice: 100, taxRate: 12, isTaxExempt: false },
      { quantity: 1, unitPrice: 100, taxRate: 12, isTaxExempt: true },
    ]);
    expect(result.subtotal).toBe('200.00');
    expect(result.totalTax).toBe('12.00');
    expect(result.totalAmount).toBe('212.00');
  });

  it('handles empty items array', () => {
    const result = calculateInvoiceTotals([]);
    expect(result.subtotal).toBe('0.00');
    expect(result.totalTax).toBe('0.00');
    expect(result.totalAmount).toBe('0.00');
    expect(result.taxBreakdown).toHaveLength(0);
  });
});

describe('calculateAmountDue', () => {
  it('calculates correct amount due', () => {
    expect(calculateAmountDue('1000.00', '300.00')).toBe('700.00');
  });

  it('returns 0 when fully paid', () => {
    expect(calculateAmountDue('500.00', '500.00')).toBe('0.00');
  });

  it('returns 0 when overpaid', () => {
    expect(calculateAmountDue('500.00', '600.00')).toBe('0.00');
  });

  it('returns full amount when nothing paid', () => {
    expect(calculateAmountDue('750.00', '0.00')).toBe('750.00');
  });
});

describe('determinePaymentStatus', () => {
  it('returns unpaid when nothing paid', () => {
    expect(determinePaymentStatus('1000.00', '0.00')).toBe('unpaid');
  });

  it('returns partial when partially paid', () => {
    expect(determinePaymentStatus('1000.00', '500.00')).toBe('partial');
  });

  it('returns paid when fully paid', () => {
    expect(determinePaymentStatus('1000.00', '1000.00')).toBe('paid');
  });

  it('returns paid when overpaid', () => {
    expect(determinePaymentStatus('1000.00', '1200.00')).toBe('paid');
  });
});
