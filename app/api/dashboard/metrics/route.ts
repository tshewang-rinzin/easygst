import { NextResponse } from 'next/server';
import {
  getInvoices,
  getTotalRevenue,
  getTotalOutstanding,
} from '@/lib/invoices/queries';
import { getCashSales } from '@/lib/invoices/cash-sales-queries';
import { getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { invoices } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import Decimal from 'decimal.js';

export async function GET() {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all invoices
    const allInvoices = await getInvoices();

    // Get cash sales
    const cashSales = await getCashSales();

    // Separate tax invoices (credit sales) from cash sales
    const taxInvoices = allInvoices.filter(
      (inv) => !inv.paymentTerms?.includes('Cash Sale')
    );

    // Calculate tax invoice metrics
    const taxInvoiceCount = taxInvoices.length;
    const taxInvoiceRevenue = taxInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum.plus(inv.totalAmount), new Decimal(0));

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
      (inv) => inv.paymentStatus === 'unpaid' || inv.paymentStatus === 'partial'
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

    // GST Summary - Output GST from all invoices
    const outputGST = allInvoices.reduce(
      (sum, inv) => sum.plus(inv.totalTax),
      new Decimal(0)
    );

    // Input GST (from purchases - placeholder for now)
    const inputGST = new Decimal(0);

    // Net GST Payable
    const netGST = outputGST.minus(inputGST);

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
}
