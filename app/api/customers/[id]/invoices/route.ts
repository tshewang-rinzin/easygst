import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { invoices } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { eq, and, desc } from 'drizzle-orm';

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id: customerId } = await context.params;
    const team = await getTeamForUser();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 401 });
    }

    const customerInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        totalAmount: invoices.totalAmount,
        amountDue: invoices.amountDue,
        currency: invoices.currency,
        status: invoices.status,
        paymentStatus: invoices.paymentStatus,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.teamId, team.id),
          eq(invoices.customerId, customerId)
        )
      )
      .orderBy(desc(invoices.invoiceDate));

    return NextResponse.json(customerInvoices);
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer invoices' },
      { status: 500 }
    );
  }
}
