/**
 * Script to create a test invitation
 * Usage: tsx scripts/create-test-invitation.ts <email> <role>
 * Example: tsx scripts/create-test-invitation.ts test@example.com admin
 */

import { db } from '../lib/db/drizzle';
import { invitations, teams, users } from '../lib/db/schema';
import { randomBytes } from 'crypto';
import { sendEmail } from '../lib/email/utils';
import TeamInvitationEmail from '../lib/email/templates/team-invitation-email';

async function createTestInvitation(email: string, role: string) {
  try {
    // Get the first team and user
    const [team] = await db.select().from(teams).limit(1);
    const [user] = await db.select().from(users).limit(1);

    if (!team) {
      console.error('❌ No team found. Please create a team first by signing up.');
      process.exit(1);
    }

    if (!user) {
      console.error('❌ No user found. Please create a user first by signing up.');
      process.exit(1);
    }

    console.log(`\n📧 Creating invitation for: ${email}`);
    console.log(`   Team: ${team.name}`);
    console.log(`   Role: ${role}`);
    console.log(`   Invited by: ${user.email}\n`);

    // Generate invitation token
    const invitationToken = randomBytes(32).toString('hex');
    const invitationTokenExpiry = new Date();
    invitationTokenExpiry.setDate(invitationTokenExpiry.getDate() + 7); // 7 days

    // Create invitation
    const [invitation] = await db
      .insert(invitations)
      .values({
        teamId: team.id,
        email,
        role,
        invitedBy: user.id,
        invitationToken,
        invitationTokenExpiry,
        lastEmailSentAt: new Date(),
        emailSentCount: 1,
      })
      .returning();

    console.log(`✅ Invitation created in database (ID: ${invitation.id})`);

    // Send invitation email
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/sign-up?token=${invitationToken}`;

    console.log(`\n📬 Sending invitation email...`);
    console.log(`   To: ${email}`);
    console.log(`   From: ${process.env.EMAIL_FROM || 'no-reply@cloudbhutan.com'}`);
    console.log(`   SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);

    await sendEmail({
      to: email,
      subject: `You've been invited to join ${team.name} on EasyGST`,
      template: TeamInvitationEmail({
        invitedByName: user.name || undefined,
        invitedByEmail: user.email,
        teamName: team.name,
        role: role,
        invitationUrl,
        expiryDays: 7,
      }),
    });

    console.log(`\n✅ Email sent successfully!`);
    console.log(`\n🔗 Invitation URL:`);
    console.log(`   ${invitationUrl}`);
    console.log(`\n📅 Expires: ${invitationTokenExpiry.toLocaleString()}`);
    console.log(`\n✅ Done! Check the email inbox for ${email}`);
    console.log(`\nTo resend: tsx scripts/resend-invitation.ts ${invitation.id}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('\nPossible issues:');
    console.error('- Email configuration in .env.production not loaded');
    console.error('- SMTP credentials invalid');
    console.error('- Network connectivity issues');
    process.exit(1);
  }
}

const email = process.argv[2];
const role = process.argv[3] || 'member';

if (!email) {
  console.error('Usage: tsx scripts/create-test-invitation.ts <email> <role>');
  console.error('Example: tsx scripts/create-test-invitation.ts test@example.com admin');
  console.error('\nValid roles: owner, admin, member (default: member)');
  process.exit(1);
}

if (!['owner', 'admin', 'member'].includes(role)) {
  console.error('Invalid role. Must be: owner, admin, or member');
  process.exit(1);
}

console.log('\n🚀 Creating test invitation...\n');
createTestInvitation(email, role);
