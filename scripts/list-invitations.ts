/**
 * Script to list all pending invitations
 * Usage: tsx scripts/list-invitations.ts
 */

import { db } from '../lib/db/drizzle';
import { invitations, teams, users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function listInvitations() {
  try {
    const pendingInvitations = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        invitedAt: invitations.invitedAt,
        emailSentCount: invitations.emailSentCount,
        invitationToken: invitations.invitationToken,
        invitationTokenExpiry: invitations.invitationTokenExpiry,
        teamName: teams.name,
        invitedByName: users.name,
        invitedByEmail: users.email,
      })
      .from(invitations)
      .innerJoin(teams, eq(invitations.teamId, teams.id))
      .innerJoin(users, eq(invitations.invitedBy, users.id))
      .where(eq(invitations.status, 'pending'));

    if (pendingInvitations.length === 0) {
      console.log('No pending invitations found.');
      process.exit(0);
    }

    console.log(`\n📋 Found ${pendingInvitations.length} pending invitation(s):\n`);

    pendingInvitations.forEach((inv) => {
      console.log(`ID: ${inv.id}`);
      console.log(`  Email: ${inv.email}`);
      console.log(`  Team: ${inv.teamName}`);
      console.log(`  Role: ${inv.role}`);
      console.log(`  Invited by: ${inv.invitedByName || inv.invitedByEmail}`);
      console.log(`  Invited at: ${inv.invitedAt.toLocaleString()}`);
      console.log(`  Email sent count: ${inv.emailSentCount || 0}`);
      console.log(`  Has token: ${inv.invitationToken ? 'Yes' : 'No'}`);
      if (inv.invitationTokenExpiry) {
        const isExpired = inv.invitationTokenExpiry < new Date();
        console.log(`  Expires: ${inv.invitationTokenExpiry.toLocaleString()} ${isExpired ? '(EXPIRED)' : ''}`);
      } else {
        console.log(`  Expires: Not set (needs resend)`);
      }
      console.log('');
    });

    console.log(`To resend an invitation, run:`);
    console.log(`tsx scripts/resend-invitation.ts <invitation_id>`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listInvitations();
