import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { invoices, customers, teams, emailSettings } from '@/lib/db/schema';
import { eq, and, or, lt, isNotNull, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/utils';
import PaymentReminderEmail from '@/lib/email/templates/payment-reminder-email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Cron endpoint to send payment reminders for overdue invoices.
 * Protected by CRON_SECRET header.
 * Set up via Vercel Cron Jobs or external scheduler.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find overdue invoices that haven't had a reminder in the last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdueInvoices = await db
      .select({
        invoice: invoices,
        customer: customers,
        team: teams,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .innerJoin(teams, eq(invoices.teamId, teams.id))
      .where(
        and(
          or(
            eq(invoices.paymentStatus, 'unpaid'),
            eq(invoices.paymentStatus, 'partial')
          ),
          or(
            eq(invoices.status, 'sent'),
            eq(invoices.status, 'overdue')
          ),
          lt(invoices.dueDate, today),
          isNotNull(customers.email),
          // Only send if no reminder in last 7 days
          or(
            sql`${invoices.lastReminderSentAt} IS NULL`,
            lt(invoices.lastReminderSentAt, sevenDaysAgo)
          )
        )
      )
      .limit(50); // Process max 50 per run

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const { invoice, customer, team } of overdueInvoices) {
      if (!customer.email) continue;

      try {
        // Calculate days overdue
        const dueDate = new Date(invoice.dueDate!);
        const daysOverdue = Math.ceil(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const displayName = team.businessName || team.name;

        const viewUrl = process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`
          : undefined;

        await sendEmail({
          to: customer.email,
          subject: `Payment Overdue: Invoice ${invoice.invoiceNumber}`,
          template: PaymentReminderEmail({
            businessName: displayName,
            customerName: customer.name,
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            dueDate: new Date(invoice.dueDate!).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            amountDue: `${invoice.currency} ${parseFloat(invoice.amountDue).toFixed(2)}`,
            currency: invoice.currency,
            daysOverdue,
            viewUrl,
          }),
        });

        // Update last reminder sent
        await db
          .update(invoices)
          .set({
            lastReminderSentAt: new Date(),
            status: 'overdue',
          })
          .where(eq(invoices.id, invoice.id));

        sent++;
      } catch (error) {
        failed++;
        errors.push(`${invoice.invoiceNumber}: Failed to send reminder`);
      }
    }

    return NextResponse.json({
      success: true,
      total: overdueInvoices.length,
      sent,
      failed,
      ...(errors.length > 0 && { errors }),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error processing overdue reminders:', error);
    return NextResponse.json(
      { error: 'Failed to process overdue reminders' },
      { status: 500 }
    );
  }
}
