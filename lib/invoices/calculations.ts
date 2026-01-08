import Decimal from 'decimal.js';

// Configure Decimal for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface LineItemInput {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRate: number;
  isTaxExempt: boolean;
}

export interface LineItemCalculated {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  itemTotal: string;
}

/**
 * Calculate totals for a single invoice line item
 */
export function calculateLineItem(item: LineItemInput): LineItemCalculated {
  const quantity = new Decimal(item.quantity);
  const unitPrice = new Decimal(item.unitPrice);
  const discountPercent = new Decimal(item.discountPercent || 0);
  const taxRate = new Decimal(item.taxRate);

  // Calculate subtotal (quantity × unit price)
  const subtotal = quantity.times(unitPrice);

  // Calculate discount amount
  const discountAmount = subtotal.times(discountPercent).dividedBy(100);

  // Calculate amount after discount
  const amountAfterDiscount = subtotal.minus(discountAmount);

  // Calculate tax amount (0 if tax exempt)
  const taxAmount = item.isTaxExempt
    ? new Decimal(0)
    : amountAfterDiscount.times(taxRate).dividedBy(100);

  // Calculate item total
  const itemTotal = amountAfterDiscount.plus(taxAmount);

  return {
    subtotal: subtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    itemTotal: itemTotal.toFixed(2),
  };
}

export interface InvoiceItem {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: string;
  taxRate: number;
  taxAmount?: string;
  isTaxExempt: boolean;
  itemTotal?: string;
}

export interface InvoiceTotals {
  subtotal: string;
  totalDiscount: string;
  totalTax: string;
  totalAmount: string;
  taxBreakdown: {
    rate: string;
    taxableAmount: string;
    taxAmount: string;
  }[];
}

/**
 * Calculate invoice totals from all line items
 */
export function calculateInvoiceTotals(items: InvoiceItem[]): InvoiceTotals {
  let subtotal = new Decimal(0);
  let totalDiscount = new Decimal(0);
  let totalTax = new Decimal(0);

  // Track tax by rate for breakdown
  const taxByRate: Map<
    string,
    { taxableAmount: Decimal; taxAmount: Decimal }
  > = new Map();

  for (const item of items) {
    // Calculate this line item
    const calculated = calculateLineItem({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent || 0,
      taxRate: item.taxRate,
      isTaxExempt: item.isTaxExempt,
    });

    // Add to totals
    subtotal = subtotal.plus(calculated.subtotal);
    totalDiscount = totalDiscount.plus(calculated.discountAmount);
    totalTax = totalTax.plus(calculated.taxAmount);

    // Track tax by rate
    const rateKey = item.isTaxExempt ? '0' : item.taxRate.toString();
    const taxableAmount = new Decimal(calculated.subtotal).minus(
      calculated.discountAmount
    );

    if (!taxByRate.has(rateKey)) {
      taxByRate.set(rateKey, {
        taxableAmount: new Decimal(0),
        taxAmount: new Decimal(0),
      });
    }

    const rateData = taxByRate.get(rateKey)!;
    rateData.taxableAmount = rateData.taxableAmount.plus(taxableAmount);
    rateData.taxAmount = rateData.taxAmount.plus(calculated.taxAmount);
  }

  // Calculate total amount
  const totalAmount = subtotal.minus(totalDiscount).plus(totalTax);

  // Convert tax breakdown to array
  const taxBreakdown = Array.from(taxByRate.entries())
    .map(([rate, data]) => ({
      rate,
      taxableAmount: data.taxableAmount.toFixed(2),
      taxAmount: data.taxAmount.toFixed(2),
    }))
    .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

  return {
    subtotal: subtotal.toFixed(2),
    totalDiscount: totalDiscount.toFixed(2),
    totalTax: totalTax.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    taxBreakdown,
  };
}

/**
 * Calculate amount due based on total and payments
 */
export function calculateAmountDue(
  totalAmount: string,
  amountPaid: string
): string {
  const total = new Decimal(totalAmount);
  const paid = new Decimal(amountPaid);
  const due = total.minus(paid);

  return due.greaterThan(0) ? due.toFixed(2) : '0.00';
}

/**
 * Determine payment status based on amounts
 */
export function determinePaymentStatus(
  totalAmount: string,
  amountPaid: string
): 'unpaid' | 'partial' | 'paid' {
  const total = new Decimal(totalAmount);
  const paid = new Decimal(amountPaid);

  if (paid.greaterThanOrEqualTo(total)) {
    return 'paid';
  } else if (paid.greaterThan(0)) {
    return 'partial';
  } else {
    return 'unpaid';
  }
}
