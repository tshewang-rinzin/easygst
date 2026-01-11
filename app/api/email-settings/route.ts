import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getEmailSettings } from '@/lib/email/queries';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getEmailSettings();

    // Return settings without password for security
    if (settings) {
      return NextResponse.json({
        id: settings.id,
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpSecure: settings.smtpSecure,
        emailFrom: settings.emailFrom,
        emailFromName: settings.emailFromName,
        emailEnabled: settings.emailEnabled,
        tlsRejectUnauthorized: settings.tlsRejectUnauthorized,
        // Don't expose password, but indicate if it's set
        hasPassword: !!settings.smtpPassword,
      });
    }

    return NextResponse.json(null);
  } catch (error) {
    console.error('[EmailSettings API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email settings' },
      { status: 500 }
    );
  }
}
