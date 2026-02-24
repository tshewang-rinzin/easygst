import { NextRequest, NextResponse } from 'next/server';
import { withMobileAuth, MobileAuthContext } from '@/lib/auth/mobile-auth';
import { db } from '@/lib/db/drizzle';
import { paymentMethods, teams } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getTeamFeatures } from '@/lib/features';

export const GET = withMobileAuth(async (request: NextRequest, context: MobileAuthContext) => {
  const teamId = context.team.id;

  const [team, methods] = await Promise.all([
    db.select({
      defaultGstRate: teams.defaultGstRate,
      currency: teams.defaultCurrency,
      invoicePrefix: teams.invoicePrefix,
      businessName: teams.businessName,
      tpn: teams.tpn,
      gstNumber: teams.gstNumber,
      address: teams.address,
      city: teams.city,
      dzongkhag: teams.dzongkhag,
      phone: teams.phone,
      email: teams.email,
      logoUrl: teams.logoUrl,
    })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1)
    .then(rows => rows[0]),

    db.select({
      id: paymentMethods.id,
      code: paymentMethods.code,
      name: paymentMethods.name,
      category: paymentMethods.category,
    })
    .from(paymentMethods)
    .where(and(eq(paymentMethods.teamId, teamId), eq(paymentMethods.isEnabled, true)))
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.name))
  ]);

  // Build full address from parts
  const addressParts = [team?.address, team?.city, team?.dzongkhag].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  const teamFeatures = await getTeamFeatures(teamId);

  return NextResponse.json({
    defaultGstRate: parseFloat(team?.defaultGstRate || '0'),
    currency: team?.currency || 'BTN',
    invoicePrefix: team?.invoicePrefix || 'INV',
    businessName: team?.businessName || '',
    tpn: team?.tpn || '',
    gstNumber: team?.gstNumber || '',
    address: fullAddress,
    phone: team?.phone || '',
    email: team?.email || '',
    logoUrl: team?.logoUrl || '',
    cashierName: context.user.name || context.user.email || 'Cashier',
    paymentMethods: methods,
    features: {
      fileAttachments: teamFeatures.has('file_attachments'),
      receiptOcr: teamFeatures.has('receipt_ocr'),
    },
  });
});
