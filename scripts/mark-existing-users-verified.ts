import { db } from '../lib/db/drizzle';
import { users } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

async function markExistingUsersVerified() {
  try {
    console.log('Marking all existing users as verified...');

    const result = await db
      .update(users)
      .set({ emailVerified: true })
      .where(sql`${users.emailVerified} = false`);

    console.log('✓ All existing users have been marked as verified');
    process.exit(0);
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
}

markExistingUsersVerified();
