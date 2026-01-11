/**
 * Script to manually resend an invitation
 * Usage: tsx scripts/resend-invitation.ts <invitation_id>
 */

// Load environment variables
import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(process.cwd(), '.env.local') });

import { db } from '../lib/db/drizzle';
import { invitations, teams, users } from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendEmail } from '../lib/email/utils';
import TeamInvitationEmail from '../lib/email/templates/team-invitation-email';

async function resendInvitation(invitationId: string) {
  try {
    // Get invitation with team and inviter details
    const result = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        teamId: invitations.teamId,
        emailSentCount: invitations.emailSentCount,
        teamName: teams.name,
        invitedByName: users.name,
        invitedByEmail: users.email,
      })
      .from(invitations)
      .innerJoin(teams, eq(invitations.teamId, teams.id))
      .innerJoin(users, eq(invitations.invitedBy, users.id))
      .where(and(
        eq(invitations.id, invitationId),
        eq(invitations.status, 'pending')
      ))
      .limit(1);

    const invitation = result[0];

    if (!invitation) {
      console.error('❌ Invitation not found or already accepted');
      process.exit(1);
    }

    console.log(`📧 Resending invitation to: ${invitation.email}`);
    console.log(`   Team: ${invitation.teamName}`);
    console.log(`   Role: ${invitation.role}`);
    console.log(`   Invited by: ${invitation.invitedByEmail}`);

    // Generate new token
    const invitationToken = randomBytes(32).toString('hex');
    const invitationTokenExpiry = new Date();
    invitationTokenExpiry.setDate(invitationTokenExpiry.getDate() + 7);

    const emailSentCount = (invitation.emailSentCount || 0) + 1;

    // Update invitation
    await db
      .update(invitations)
      .set({
        invitationToken,
        invitationTokenExpiry,
        lastEmailSentAt: new Date(),
        emailSentCount,
      })
      .where(eq(invitations.id, invitationId));

    console.log(`✅ Updated invitation with new token`);
    console.log(`   Email sent count: ${emailSentCount}`);
    console.log(`   Expires: ${invitationTokenExpiry.toLocaleString()}`);

    // Send email
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/sign-up?token=${invitationToken}`;

    await sendEmail({
      to: invitation.email,
      subject: `Reminder: You've been invited to join ${invitation.teamName} on EasyGST`,
      template: TeamInvitationEmail({
        invitedByName: invitation.invitedByName || undefined,
        invitedByEmail: invitation.invitedByEmail,
        teamName: invitation.teamName,
        role: invitation.role,
        invitationUrl,
        expiryDays: 7,
      }),
    });

    console.log(`📬 Email sent successfully!`);
    console.log(`   Invitation URL: ${invitationUrl}`);
    console.log('');
    console.log('✅ Done! Check the email inbox.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const invitationId = process.argv[2];

if (!invitationId) {
  console.error('Usage: tsx scripts/resend-invitation.ts <invitation_id>');
  process.exit(1);
}

resendInvitation(invitationId);
