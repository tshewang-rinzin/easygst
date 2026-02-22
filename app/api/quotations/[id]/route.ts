import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getQuotationById } from '@/lib/quotations/queries';

export const GET = withAuth(async (request, { user, team, params }) => {
  try {
    const { id } = params;
    const quotation = await getQuotationById(id);

    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(quotation);
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
