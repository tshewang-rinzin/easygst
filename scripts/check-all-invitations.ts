import { db } from '../lib/db/drizzle';
import { invitations } from '../lib/db/schema';

async function checkAllInvitations() {
  const allInvitations = await db.select().from(invitations);
  console.log('\nTotal invitations:', allInvitations.length);

  if (allInvitations.length === 0) {
    console.log('No invitations found in database.');
    console.log('\nTo create a test invitation, go to Settings → Users & Roles in your app and invite someone.');
  } else {
    console.log('\nAll invitations:\n');
    allInvitations.forEach(inv => {
      console.log(`ID: ${inv.id}`);
      console.log(`  Email: ${inv.email}`);
      console.log(`  Status: ${inv.status}`);
      console.log(`  Role: ${inv.role}`);
      console.log(`  Has token: ${inv.invitationToken ? 'Yes' : 'No'}`);
      console.log('');
    });
  }

  process.exit(0);
}

checkAllInvitations();
