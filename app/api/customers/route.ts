import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getCustomers } from '@/lib/customers/queries';
import { db } from '@/lib/db/drizzle';
import { customers } from '@/lib/db/schema';
import { checkUsageLimit } from '@/lib/features/limits';

export const POST = withAuth(async (request: NextRequest, { user, team }) => {
  try {
    const body = await request.json();
    const { name, email, phone, customerType } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const usageCheck = await checkUsageLimit('customers', team.id);
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: `Customer limit reached (${usageCheck.limit})` }, { status: 403 });
    }

    const [customer] = await db
      .insert(customers)
      .values({
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        customerType: customerType || 'business',
        teamId: team.id,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
});

export const GET = withAuth(async (request, { user, team }) => {
  try {
    const customers = await getCustomers();
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
});
