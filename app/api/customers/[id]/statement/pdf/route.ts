import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import {
  customers,
  invoices,
  customerPayments,
  paymentAllocations,
  paymentMethods,
  teams,
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, or, lt, sql } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';
import { renderToStream } from '@react-pdf/renderer';
import { StatementTemplate } from '@/lib/pdf/templates/statement-template';
import React from 'react';

export const GET = withAuth(async (req: NextRequest, context) => {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'from and to date parameters are required' },
        { status: 400 }
      );
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const customerId = context.params?.id;

    // Get customer info
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.teamId, team.id)))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get team/business info
    const [businessInfo] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, team.id))
      .limit(1);

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Get opening balance (sum of unpaid invoices before from date)
    const [openingBalanceResult] = await db
      .select({
        balance: sql<string>`COALESCE(SUM(${invoices.amountDue}), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.teamId, team.id),
          eq(invoices.customerId, customerId),
          lt(invoices.invoiceDate, from),
          or(
            eq(invoices.paymentStatus, 'unpaid'),
            eq(invoices.paymentStatus, 'partial')
          )
        )
      );

    const openingBalance = openingBalanceResult?.balance || '0.00';

    // Get invoices in date range
    const invoicesInRange = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        totalAmount: invoices.totalAmount,
        amountDue: invoices.amountDue,
        status: invoices.status,
        paymentStatus: invoices.paymentStatus,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.teamId, team.id),
          eq(invoices.customerId, customerId),
          gte(invoices.invoiceDate, from),
          lte(invoices.invoiceDate, to)
        )
      )
      .orderBy(desc(invoices.invoiceDate));

    // Get payments in date range
    const paymentsInRange = await db
      .select({
        id: customerPayments.id,
        paymentDate: customerPayments.paymentDate,
        amount: customerPayments.amount,
        paymentMethod: customerPayments.paymentMethod,
        paymentMethodName: paymentMethods.name,
        transactionId: customerPayments.transactionId,
        receiptNumber: customerPayments.receiptNumber,
        notes: customerPayments.notes,
        advanceNumber: customerPayments.advanceNumber,
        paymentType: customerPayments.paymentType,
      })
      .from(customerPayments)
      .leftJoin(
        paymentMethods,
        and(
          eq(paymentMethods.code, customerPayments.paymentMethod),
          eq(paymentMethods.teamId, team.id)
        )
      )
      .where(
        and(
          eq(customerPayments.teamId, team.id),
          eq(customerPayments.customerId, customerId),
          gte(customerPayments.paymentDate, from),
          lte(customerPayments.paymentDate, to)
        )
      )
      .orderBy(desc(customerPayments.paymentDate));

    // Get payment allocations to show which invoices payments were applied to
    const paymentIds = paymentsInRange.map(p => p.id);
    let paymentAllocationsMap: Record<string, Array<{ invoiceNumber: string; allocatedAmount: string }>> = {};
    
    if (paymentIds.length > 0) {
      const allocations = await db
        .select({
          customerPaymentId: paymentAllocations.customerPaymentId,
          invoiceNumber: invoices.invoiceNumber,
          allocatedAmount: paymentAllocations.allocatedAmount,
        })
        .from(paymentAllocations)
        .leftJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
        .where(
          and(
            eq(paymentAllocations.teamId, team.id),
            sql`${paymentAllocations.customerPaymentId} = ANY(${paymentIds})`
          )
        );

      allocations.forEach(allocation => {
        if (!paymentAllocationsMap[allocation.customerPaymentId]) {
          paymentAllocationsMap[allocation.customerPaymentId] = [];
        }
        if (allocation.invoiceNumber) {
          paymentAllocationsMap[allocation.customerPaymentId].push({
            invoiceNumber: allocation.invoiceNumber,
            allocatedAmount: allocation.allocatedAmount,
          });
        }
      });
    }

    // Add allocation info to payments
    const paymentsWithAllocations = paymentsInRange.map(payment => ({
      ...payment,
      allocations: paymentAllocationsMap[payment.id] || [],
    }));

    // Calculate summary
    const totalInvoiced = invoicesInRange.reduce((sum, inv) => 
      sum + parseFloat(inv.totalAmount), 0).toFixed(2);
    
    const totalPaid = paymentsInRange.reduce((sum, payment) => 
      sum + parseFloat(payment.amount), 0).toFixed(2);

    // Calculate closing balance
    const currentOutstanding = parseFloat(openingBalance) + 
      parseFloat(totalInvoiced) - parseFloat(totalPaid);

    const closingBalance = currentOutstanding.toFixed(2);

    // Prepare data for PDF template
    const statementData = {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        dzongkhag: customer.dzongkhag,
      },
      dateRange: {
        from: fromDate,
        to: toDate,
      },
      openingBalance,
      closingBalance,
      invoices: invoicesInRange.map(inv => ({
        ...inv,
        invoiceDate: inv.invoiceDate.toISOString(),
        dueDate: inv.dueDate?.toISOString(),
      })),
      payments: paymentsWithAllocations.map(payment => ({
        ...payment,
        paymentDate: payment.paymentDate.toISOString(),
      })),
      summary: {
        totalInvoiced,
        totalPaid,
        totalOutstanding: closingBalance,
      },
      business: {
        name: businessInfo?.name || '',
        businessName: businessInfo?.businessName,
        address: businessInfo?.address,
        city: businessInfo?.city,
        dzongkhag: businessInfo?.dzongkhag,
        phone: businessInfo?.phone,
        email: businessInfo?.email,
        tpn: businessInfo?.tpn,
        gstNumber: businessInfo?.gstNumber,
      },
    };

    // Generate PDF
    const document = React.createElement(StatementTemplate, {
      data: statementData,
    }) as any;

    const stream = await renderToStream(document);

    // Return the PDF
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Statement-${customer.name}-${fromDate}-${toDate}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF statement:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF statement' },
      { status: 500 }
    );
  }
});