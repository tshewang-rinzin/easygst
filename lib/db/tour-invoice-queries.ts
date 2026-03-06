import { db } from '@/lib/db/drizzle';
import {
  tourInvoices,
  tourInvoiceItems,
  tourInvoiceGuests,
  tourInvoicePayments,
  tourInvoiceSequences,
  customers,
  teams,
} from '@/lib/db/schema';
import { eq, and, ilike, desc, or, gte, lte, sql, count } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

export async function getTourInvoices(params?: {
  searchTerm?: string;
  status?: string;
  nationality?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}) {
  const team = await getTeamForUser();
  if (!team) return { invoices: [], total: 0 };

  const conditions: ReturnType<typeof eq>[] = [eq(tourInvoices.teamId, team.id)];

  if (params?.status) {
    conditions.push(eq(tourInvoices.status, params.status));
  }
  if (params?.nationality) {
    conditions.push(eq(tourInvoices.guestNationality, params.nationality));
  }
  if (params?.startDate) {
    conditions.push(gte(tourInvoices.invoiceDate, params.startDate));
  }
  if (params?.endDate) {
    conditions.push(lte(tourInvoices.invoiceDate, params.endDate));
  }

  const whereClause = params?.searchTerm
    ? and(
        ...conditions,
        or(
          ilike(tourInvoices.invoiceNumber, `%${params.searchTerm}%`),
          ilike(tourInvoices.tourName, `%${params.searchTerm}%`),
          ilike(customers.name, `%${params.searchTerm}%`)
        )
      )
    : and(...conditions);

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;

  const [results, countResult] = await Promise.all([
    db
      .select({
        tourInvoice: tourInvoices,
        customer: customers,
      })
      .from(tourInvoices)
      .leftJoin(customers, eq(tourInvoices.customerId, customers.id))
      .where(whereClause!)
      .orderBy(desc(tourInvoices.invoiceDate))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: count() })
      .from(tourInvoices)
      .leftJoin(customers, eq(tourInvoices.customerId, customers.id))
      .where(whereClause!),
  ]);

  return {
    invoices: results,
    total: countResult[0]?.total ?? 0,
  };
}

export async function getTourInvoice(id: string) {
  const team = await getTeamForUser();
  if (!team) return null;

  const [invoice] = await db
    .select({
      tourInvoice: tourInvoices,
      customer: customers,
    })
    .from(tourInvoices)
    .leftJoin(customers, eq(tourInvoices.customerId, customers.id))
    .where(and(eq(tourInvoices.id, id), eq(tourInvoices.teamId, team.id)))
    .limit(1);

  if (!invoice) return null;

  const [items, guests, payments] = await Promise.all([
    db
      .select()
      .from(tourInvoiceItems)
      .where(eq(tourInvoiceItems.tourInvoiceId, id))
      .orderBy(tourInvoiceItems.category, tourInvoiceItems.sortOrder),
    db
      .select()
      .from(tourInvoiceGuests)
      .where(eq(tourInvoiceGuests.tourInvoiceId, id))
      .orderBy(tourInvoiceGuests.sortOrder),
    db
      .select()
      .from(tourInvoicePayments)
      .where(eq(tourInvoicePayments.tourInvoiceId, id))
      .orderBy(desc(tourInvoicePayments.paymentDate)),
  ]);

  return {
    ...invoice.tourInvoice,
    customer: invoice.customer,
    items,
    guests,
    payments,
  };
}

export async function getNextTourInvoiceNumber(teamId: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Get team's prefix
  const [team] = await db
    .select({ tourInvoicePrefix: teams.tourInvoicePrefix })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const prefix = team?.tourInvoicePrefix || 'TI';

  // Upsert sequence and increment
  const result = await db.execute(sql`
    INSERT INTO tour_invoice_sequences (id, team_id, year, last_number, updated_at)
    VALUES (gen_random_uuid(), ${teamId}, ${currentYear}, 1, NOW())
    ON CONFLICT (team_id, year) DO UPDATE
    SET last_number = tour_invoice_sequences.last_number + 1,
        updated_at = NOW()
    RETURNING last_number
  `);

  const lastNumber = (result as any)[0]?.last_number ?? 1;
  return `${prefix}-${currentYear}-${String(lastNumber).padStart(4, '0')}`;
}

export async function getTourInvoiceByPublicId(publicId: string) {
  const [invoice] = await db
    .select({
      tourInvoice: tourInvoices,
      customer: customers,
      team: teams,
    })
    .from(tourInvoices)
    .leftJoin(customers, eq(tourInvoices.customerId, customers.id))
    .leftJoin(teams, eq(tourInvoices.teamId, teams.id))
    .where(eq(tourInvoices.publicId, publicId))
    .limit(1);

  if (!invoice) return null;

  const [items, guests, payments] = await Promise.all([
    db
      .select()
      .from(tourInvoiceItems)
      .where(eq(tourInvoiceItems.tourInvoiceId, invoice.tourInvoice.id))
      .orderBy(tourInvoiceItems.category, tourInvoiceItems.sortOrder),
    db
      .select()
      .from(tourInvoiceGuests)
      .where(eq(tourInvoiceGuests.tourInvoiceId, invoice.tourInvoice.id))
      .orderBy(tourInvoiceGuests.sortOrder),
    db
      .select()
      .from(tourInvoicePayments)
      .where(eq(tourInvoicePayments.tourInvoiceId, invoice.tourInvoice.id))
      .orderBy(desc(tourInvoicePayments.paymentDate)),
  ]);

  return {
    ...invoice.tourInvoice,
    customer: invoice.customer,
    team: invoice.team,
    items,
    guests,
    payments,
  };
}

export async function markTourInvoiceViewed(publicId: string) {
  await db
    .update(tourInvoices)
    .set({
      viewedAt: new Date(),
      status: sql`CASE WHEN ${tourInvoices.status} = 'sent' THEN 'viewed' ELSE ${tourInvoices.status} END`,
      updatedAt: new Date(),
    })
    .where(eq(tourInvoices.publicId, publicId));
}

export async function getTourInvoiceStats() {
  const team = await getTeamForUser();
  if (!team) return { total: 0, totalRevenue: '0', totalSdf: '0', outstanding: '0', draft: 0, sent: 0, paid: 0 };

  const [stats] = await db
    .select({
      total: count(),
      totalRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${tourInvoices.status} IN ('paid', 'partial') THEN ${tourInvoices.grandTotal} ELSE 0 END), 0)`,
      totalSdf: sql<string>`COALESCE(SUM(CASE WHEN ${tourInvoices.status} IN ('paid', 'partial') THEN ${tourInvoices.sdfTotal} ELSE 0 END), 0)`,
      outstanding: sql<string>`COALESCE(SUM(CASE WHEN ${tourInvoices.status} != 'cancelled' THEN ${tourInvoices.amountDue} ELSE 0 END), 0)`,
      draft: sql<number>`COUNT(*) FILTER (WHERE ${tourInvoices.status} = 'draft')`,
      sent: sql<number>`COUNT(*) FILTER (WHERE ${tourInvoices.status} = 'sent')`,
      paid: sql<number>`COUNT(*) FILTER (WHERE ${tourInvoices.status} = 'paid')`,
    })
    .from(tourInvoices)
    .where(eq(tourInvoices.teamId, team.id));

  return stats ?? { total: 0, totalRevenue: '0', totalSdf: '0', outstanding: '0', draft: 0, sent: 0, paid: 0 };
}

// ============================================================
// REPORT QUERIES
// ============================================================

export async function getTourRevenueByCategory(dateFrom?: Date, dateTo?: Date) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions: ReturnType<typeof eq>[] = [eq(tourInvoices.teamId, team.id)];
  if (dateFrom) conditions.push(gte(tourInvoices.invoiceDate, dateFrom));
  if (dateTo) conditions.push(lte(tourInvoices.invoiceDate, dateTo));

  const results = await db
    .select({
      category: tourInvoiceItems.category,
      totalAmount: sql<string>`COALESCE(SUM(${tourInvoiceItems.itemTotal}::numeric), 0)`,
      itemCount: sql<number>`COUNT(*)`,
    })
    .from(tourInvoiceItems)
    .innerJoin(tourInvoices, eq(tourInvoiceItems.tourInvoiceId, tourInvoices.id))
    .where(and(...conditions))
    .groupBy(tourInvoiceItems.category)
    .orderBy(sql`SUM(${tourInvoiceItems.itemTotal}::numeric) DESC`);

  return results;
}

export async function getTourSDFReport(dateFrom?: Date, dateTo?: Date) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions: ReturnType<typeof eq>[] = [eq(tourInvoices.teamId, team.id)];
  if (dateFrom) conditions.push(gte(tourInvoices.invoiceDate, dateFrom));
  if (dateTo) conditions.push(lte(tourInvoices.invoiceDate, dateTo));

  const results = await db
    .select({
      month: sql<string>`TO_CHAR(${tourInvoices.invoiceDate}, 'YYYY-MM')`,
      totalGuests: sql<number>`COALESCE(SUM(${tourInvoices.numberOfGuests}), 0)`,
      sdfAmount: sql<string>`COALESCE(SUM(${tourInvoices.sdfTotal}::numeric), 0)`,
      invoiceCount: sql<number>`COUNT(*)`,
    })
    .from(tourInvoices)
    .where(and(...conditions))
    .groupBy(sql`TO_CHAR(${tourInvoices.invoiceDate}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${tourInvoices.invoiceDate}, 'YYYY-MM') DESC`);

  return results;
}

export async function getTourGuestNationalityStats(dateFrom?: Date, dateTo?: Date) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions: ReturnType<typeof eq>[] = [eq(tourInvoices.teamId, team.id)];
  if (dateFrom) conditions.push(gte(tourInvoices.invoiceDate, dateFrom));
  if (dateTo) conditions.push(lte(tourInvoices.invoiceDate, dateTo));

  const results = await db
    .select({
      nationality: tourInvoiceGuests.nationality,
      guestCount: sql<number>`COUNT(*)`,
    })
    .from(tourInvoiceGuests)
    .innerJoin(tourInvoices, eq(tourInvoiceGuests.tourInvoiceId, tourInvoices.id))
    .where(and(...conditions))
    .groupBy(tourInvoiceGuests.nationality)
    .orderBy(sql`COUNT(*) DESC`);

  return results;
}

export async function getTourTypeStats(dateFrom?: Date, dateTo?: Date) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions: ReturnType<typeof eq>[] = [eq(tourInvoices.teamId, team.id)];
  if (dateFrom) conditions.push(gte(tourInvoices.invoiceDate, dateFrom));
  if (dateTo) conditions.push(lte(tourInvoices.invoiceDate, dateTo));

  const results = await db
    .select({
      tourType: tourInvoices.tourType,
      invoiceCount: sql<number>`COUNT(*)`,
      totalRevenue: sql<string>`COALESCE(SUM(${tourInvoices.grandTotal}::numeric), 0)`,
      totalGuests: sql<number>`COALESCE(SUM(${tourInvoices.numberOfGuests}), 0)`,
    })
    .from(tourInvoices)
    .where(and(...conditions))
    .groupBy(tourInvoices.tourType)
    .orderBy(sql`SUM(${tourInvoices.grandTotal}::numeric) DESC`);

  return results;
}

export async function getTourInvoicesForExport(params?: {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions: ReturnType<typeof eq>[] = [eq(tourInvoices.teamId, team.id)];
  if (params?.status) conditions.push(eq(tourInvoices.status, params.status));
  if (params?.dateFrom) conditions.push(gte(tourInvoices.invoiceDate, params.dateFrom));
  if (params?.dateTo) conditions.push(lte(tourInvoices.invoiceDate, params.dateTo));

  const results = await db
    .select({
      tourInvoice: tourInvoices,
      customer: customers,
    })
    .from(tourInvoices)
    .leftJoin(customers, eq(tourInvoices.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(tourInvoices.invoiceDate));

  return results;
}
