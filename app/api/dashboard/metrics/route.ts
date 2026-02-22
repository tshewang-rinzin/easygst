import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import {
  getInvoices,
  getTotalRevenue,
  getTotalOutstanding,
} from '@/lib/invoices/queries';
import { getCashSales } from '@/lib/invoices/cash-sales-queries';
import { getCustomerAdvances } from '@/lib/customer-payments/queries';
import { getSupplierAdvances } from '@/lib/supplier-payments/queries';
import { db } from '@/lib/db/drizzle';
import { invoices, supplierBills } from '@/lib/db/schema';
import { eq, and, lt, ne } from 'drizzle-orm';
import Decimal from 'decimal.js';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  try {
    console.log('[Dashboard] Team ID:', team.id);

    // Get all invoices
    const allInvoices = await getInvoices();
    console.log('[Dashboard] Found', allInvoices.length, 'invoices');

    // Get cash sales
    const cashSales = await getCashSales();
    console.log('[Dashboard] Found', cashSales.length, 'cash sales');

    // Separate tax invoices (credit sales) from cash sales
    const taxInvoices = allInvoices.filter(
      (item) => !item.invoice.paymentTerms?.includes('Cash Sale')
    );

    // Calculate tax invoice metrics
    const taxInvoiceCount = taxInvoices.length;
    const taxInvoiceRevenue = taxInvoices
      .filter((item) => item.invoice.status === 'paid')
      .reduce((sum, item) => sum.plus(item.invoice.totalAmount), new Decimal(0));

    // Calculate cash sale metrics
    const cashSaleCount = cashSales.length;
    const cashSaleRevenue = cashSales.reduce(
      (sum, { invoice }) => sum.plus(invoice.totalAmount),
      new Decimal(0)
    );

    // Total sales metrics
    const totalInvoices = allInvoices.length;
    const totalRevenue = await getTotalRevenue();

    // Outstanding metrics
    const totalOutstanding = await getTotalOutstanding();
    const unpaidInvoices = allInvoices.filter(
      (item) => item.invoice.paymentStatus === 'unpaid' || item.invoice.paymentStatus === 'partial'
    );
    const unpaidCount = unpaidInvoices.length;

    // Overdue invoices (past due date and not fully paid)
    const today = new Date();
    const overdueInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.teamId, team.id),
          lt(invoices.dueDate, today),
          eq(invoices.paymentStatus, 'unpaid')
        )
      );
    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum.plus(inv.amountDue),
      new Decimal(0)
    );

    // GST Summary - Output GST from all paid invoices
    const outputGST = allInvoices
      .filter((item) => item.invoice.status === 'paid')
      .reduce(
        (sum, item) => sum.plus(item.invoice.totalTax),
        new Decimal(0)
      );

    // Input GST (from supplier bills - paid purchases)
    const paidBills = await db
      .select()
      .from(supplierBills)
      .where(
        and(
          eq(supplierBills.teamId, team.id),
          ne(supplierBills.status, 'cancelled'),
          ne(supplierBills.status, 'draft')
        )
      );

    console.log('[Dashboard] Found', paidBills.length, 'supplier bills');

    const inputGST = paidBills.reduce(
      (sum, bill) => sum.plus(bill.totalTax),
      new Decimal(0)
    );

    console.log('[Dashboard] Output GST:', outputGST.toFixed(2));
    console.log('[Dashboard] Input GST:', inputGST.toFixed(2));

    // Net GST Payable (Output GST - Input GST)
    const netGST = outputGST.minus(inputGST);
    console.log('[Dashboard] Net GST:', netGST.toFixed(2));

    // Customer Advances
    const customerAdvances = await getCustomerAdvances();
    const customerAdvanceCount = customerAdvances.length;
    const customerAdvanceTotal = customerAdvances.reduce(
      (sum, adv) => sum.plus(adv.amount),
      new Decimal(0)
    );
    const customerAdvanceUnallocated = customerAdvances.reduce(
      (sum, adv) => sum.plus(adv.unallocatedAmount),
      new Decimal(0)
    );

    console.log('[Dashboard] Customer Advances:', customerAdvanceCount);

    // Supplier Advances
    const supplierAdvances = await getSupplierAdvances();
    const supplierAdvanceCount = supplierAdvances.length;
    const supplierAdvanceTotal = supplierAdvances.reduce(
      (sum, adv) => sum.plus(adv.amount),
      new Decimal(0)
    );
    const supplierAdvanceUnallocated = supplierAdvances.reduce(
      (sum, adv) => sum.plus(adv.unallocatedAmount),
      new Decimal(0)
    );

    console.log('[Dashboard] Supplier Advances:', supplierAdvanceCount);

    // Get default currency from team settings
    const currency = team.defaultCurrency || 'BTN';

    return NextResponse.json({
      // Sales Overview
      taxInvoices: {
        count: taxInvoiceCount,
        revenue: taxInvoiceRevenue.toFixed(2),
      },
      cashSales: {
        count: cashSaleCount,
        revenue: cashSaleRevenue.toFixed(2),
      },
      totalSales: {
        count: totalInvoices,
        revenue: totalRevenue,
      },

      // Outstanding
      outstanding: {
        total: totalOutstanding,
        count: unpaidCount,
      },
      overdue: {
        count: overdueCount,
        amount: overdueAmount.toFixed(2),
      },

      // GST Summary
      gst: {
        output: outputGST.toFixed(2),
        input: inputGST.toFixed(2),
        net: netGST.toFixed(2),
      },

      // Advances
      customerAdvances: {
        count: customerAdvanceCount,
        total: customerAdvanceTotal.toFixed(2),
        unallocated: customerAdvanceUnallocated.toFixed(2),
      },
      supplierAdvances: {
        count: supplierAdvanceCount,
        total: supplierAdvanceTotal.toFixed(2),
        unallocated: supplierAdvanceUnallocated.toFixed(2),
      },

      // Legacy fields for compatibility
      totalInvoices,
      totalRevenue,
      totalOutstanding,
      currency,
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
});
