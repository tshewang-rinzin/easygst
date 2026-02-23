import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import { customers } from '@/lib/db/schema';
import { eq, and, or, ilike, asc } from 'drizzle-orm';

export const GET = withMobileAuth(async (request: NextRequest, context: MobileAuthContext) => {
  const teamId = context.team.id;
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  const conditions = [eq(customers.teamId, teamId)];

  if (search && search.length >= 2) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(customers.name, pattern),
        ilike(customers.phone, pattern),
        ilike(customers.email, pattern)
      )!
    );
  }

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      customerType: customers.customerType,
      phone: customers.phone,
      mobile: customers.mobile,
      email: customers.email,
      tpn: customers.tpn,
      address: customers.address,
      city: customers.city,
      dzongkhag: customers.dzongkhag,
      creditLimit: customers.creditLimit,
      isWalkIn: customers.isWalkIn,
    })
    .from(customers)
    .where(and(...conditions))
    .orderBy(asc(customers.name))
    .limit(20);

  return NextResponse.json({ customers: rows });
});
