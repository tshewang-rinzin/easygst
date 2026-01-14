import { db } from './drizzle';
import { users, teams, teamMembers, platformAdmins, TeamRole } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function seed() {
  // Check for platform admin email from environment
  const platformAdminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@example.com';
  const platformAdminPassword = process.env.PLATFORM_ADMIN_PASSWORD || 'admin123';

  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);
  const adminPasswordHash = await hashPassword(platformAdminPassword);

  // Create platform admin in separate platformAdmins table
  const [adminUser] = await db
    .insert(platformAdmins)
    .values([
      {
        email: platformAdminEmail,
        passwordHash: adminPasswordHash,
        name: 'Platform Admin',
        isActive: true,
      },
    ])
    .onConflictDoNothing()
    .returning();

  if (adminUser) {
    console.log(`Platform admin created: ${platformAdminEmail}`);
    console.log('Admin can now login at /admin/login');
  } else {
    console.log('Platform admin already exists or could not be created.');
  }

  // Create regular test user (tenant user)
  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        emailVerified: true,
      },
    ])
    .onConflictDoNothing()
    .returning();

  if (user) {
    console.log('Test user created.');

    const [team] = await db
      .insert(teams)
      .values({
        name: 'Test Team',
      })
      .returning();

    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: user.id,
      role: TeamRole.OWNER,
    });

    console.log('Test team and user created successfully.');
  } else {
    console.log('Test user already exists.');
  }
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
