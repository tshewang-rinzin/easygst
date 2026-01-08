import { NextRequest, NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { customers } from '@/lib/db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const team = await getTeamForUser();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const results = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
      })
      .from(customers)
      .where(
        and(
          eq(customers.teamId, team.id),
          or(
            ilike(customers.name, `%${query}%`),
            ilike(customers.email, `%${query}%`),
            ilike(customers.phone, `%${query}%`)
          )
        )
      )
      .limit(10);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Customer search error:', error);
    return NextResponse.json({ error: 'Failed to search customers' }, { status: 500 });
  }
}
