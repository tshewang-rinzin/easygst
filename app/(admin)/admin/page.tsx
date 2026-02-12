import { db } from '@/lib/db/drizzle';
import { users, teams, invoices, supplierBills, activityLogs } from '@/lib/db/schema';
import { count, isNull, desc, eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, FileText, Shield, Activity, Receipt } from 'lucide-react';
import { getPlatformAdmin } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

async function getStats() {
  const [[userCount], [teamCount], [invoiceCount], [billCount], recentActivity] = await Promise.all([
    db.select({ count: count() }).from(users).where(isNull(users.deletedAt)),
    db.select({ count: count() }).from(teams),
    db.select({ count: count() }).from(invoices),
    db.select({ count: count() }).from(supplierBills),
    db.select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      userName: users.name,
    })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.timestamp))
      .limit(5),
  ]);

  return {
    users: userCount.count,
    teams: teamCount.count,
    invoices: invoiceCount.count,
    bills: billCount.count,
    recentActivity,
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bills}</div>
            <p className="text-xs text-muted-foreground">
              Supplier bills across all tenants
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
            <a
              href="/admin/audit-log"
              className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Audit Log</div>
              <div className="text-sm text-gray-500">View platform-wide activity history</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity</p>
            ) : (
              stats.recentActivity.map((log) => (
                <div key={log.id} className="flex justify-between items-start text-sm border-b pb-2 last:border-0">
                  <div>
                    <span className="font-medium">{log.userName || 'System'}</span>
                    <p className="text-gray-500 text-xs">{log.action}</p>
                  </div>
                  <span className="text-gray-400 text-xs whitespace-nowrap ml-2">
                    {new Date(log.timestamp).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
            {stats.recentActivity.length > 0 && (
              <a href="/admin/audit-log" className="text-sm text-blue-600 hover:underline block text-center pt-1">
                View all activity
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
