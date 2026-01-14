import { db } from '@/lib/db/drizzle';
import { users, teamMembers, teams } from '@/lib/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';
import { getPlatformAdmin } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { UsersTable } from './users-table';

async function getUsers() {
  const allUsers = await db
    .select({
      user: users,
      teamName: teams.name,
      teamRole: teamMembers.role,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt));

  return allUsers;
}

export default async function AdminUsersPage() {
  const admin = await getPlatformAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  const allUsers = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">
          Manage all users on the platform
        </p>
      </div>

      <UsersTable users={allUsers} />
    </div>
  );
}
