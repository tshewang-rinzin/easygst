import { db } from '@/lib/db/drizzle';
import { users, teams, invoices } from '@/lib/db/schema';
import { count, isNull } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, FileText, Shield } from 'lucide-react';
import { getPlatformAdmin } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

async function getStats() {
  const [userCount] = await db
    .select({ count: count() })
    .from(users)
    .where(isNull(users.deletedAt));

  const [teamCount] = await db.select({ count: count() }).from(teams);

  const [invoiceCount] = await db.select({ count: count() }).from(invoices);

  return {
    users: userCount.count,
    teams: teamCount.count,
    invoices: invoiceCount.count,
  };
}

export default async function AdminDashboard() {
  // Require admin authentication
  const admin = await getPlatformAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Manage your platform settings, users, and tenants
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">
              Registered users on the platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teams}</div>
            <p className="text-xs text-muted-foreground">
              Business tenants on the platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoices}</div>
            <p className="text-xs text-muted-foreground">
              Invoices created across all tenants
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Admin Access</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">Active</div>
            <p className="text-xs text-purple-700">
              Platform admin privileges enabled
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/users"
              className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Manage Users</div>
              <div className="text-sm text-gray-500">View and manage all platform users</div>
            </a>
            <a
              href="/admin/teams"
              className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Manage Teams</div>
              <div className="text-sm text-gray-500">View and manage all business tenants</div>
            </a>
            <a
              href="/admin/email-settings"
              className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Email Settings</div>
              <div className="text-sm text-gray-500">Configure platform-wide email settings</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Platform Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Environment</span>
              <span className="font-medium">{process.env.NODE_ENV}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Database</span>
              <span className="font-medium">PostgreSQL</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
