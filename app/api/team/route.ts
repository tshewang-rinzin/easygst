import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withAuth(async (request: NextRequest, { team }) => {
  return NextResponse.json(team);
});

export const PUT = withAuth(async (request: NextRequest, { team }) => {
  try {
    const data = await request.json();

    const updateData: Record<string, any> = { updatedAt: new Date() };

    const allowedFields = [
      'businessName', 'businessTypeId', 'tpn', 'gstNumber', 'licenseNumber',
      'address', 'city', 'dzongkhag', 'postalCode', 'phone', 'email', 'website',
      'defaultCurrency', 'invoicePrefix', 'invoiceTerms', 'invoiceFooter',
      'logoUrl', 'invoiceTemplate', 'invoiceAccentColor',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field] || null;
      }
    }

    // defaultCurrency should not be null
    if (data.defaultCurrency) {
      updateData.defaultCurrency = data.defaultCurrency;
    }

    await db.update(teams).set(updateData).where(eq(teams.id, team.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
});
