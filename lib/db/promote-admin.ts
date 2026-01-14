/**
 * Script to create a platform admin account
 *
 * Usage:
 *   npx tsx lib/db/promote-admin.ts <email> [password]
 *
 * Example:
 *   npx tsx lib/db/promote-admin.ts admin@example.com
 *   npx tsx lib/db/promote-admin.ts admin@example.com mypassword123
 *
 * Note: If password is not provided, a random one will be generated and displayed.
 */

import { db } from './drizzle';
import { platformAdmins } from './schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/session';
import { randomBytes } from 'crypto';

async function createAdmin() {
  const email = process.argv[2];
  let password = process.argv[3];

  if (!email) {
    console.error('Usage: npx tsx lib/db/promote-admin.ts <email> [password]');
    console.error('Example: npx tsx lib/db/promote-admin.ts admin@example.com');
    console.error('Example: npx tsx lib/db/promote-admin.ts admin@example.com mypassword123');
    process.exit(1);
  }

  // Check if admin already exists
  const [existingAdmin] = await db
    .select()
    .from(platformAdmins)
    .where(eq(platformAdmins.email, email))
    .limit(1);

  if (existingAdmin) {
    console.log(`Admin "${email}" already exists.`);
    if (existingAdmin.isActive) {
      console.log('Admin account is active. They can login at /admin/login');
    } else {
      console.log('Admin account is inactive. Activating...');
      await db
        .update(platformAdmins)
        .set({ isActive: true })
        .where(eq(platformAdmins.id, existingAdmin.id));
      console.log('Admin account activated.');
    }
    process.exit(0);
  }

  // Generate password if not provided
  if (!password) {
    password = randomBytes(12).toString('base64').slice(0, 16);
    console.log('\nGenerated password (save this, it will not be shown again):');
    console.log(`  Password: ${password}\n`);
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Create the admin
  const [admin] = await db
    .insert(platformAdmins)
    .values({
      email,
      passwordHash,
      name: 'Platform Admin',
      isActive: true,
    })
    .returning();

  console.log(`Successfully created platform admin "${email}".`);
  console.log('The admin can now login at /admin/login');
}

createAdmin()
  .catch((error) => {
    console.error('Failed to create admin:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
