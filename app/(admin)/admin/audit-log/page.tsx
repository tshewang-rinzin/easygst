import { db } from '@/lib/db/drizzle';
import { activityLogs, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getPlatformAdmin } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ScrollText, Clock, User, Globe } from 'lucide-react';
import Link from 'next/link';

async function getAuditLogs() {
  const logs = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
      userEmail: users.email,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(100);

  return logs;
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export default async function AdminAuditLogPage() {
  const admin = await getPlatformAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  const logs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 mt-1">
            Review recent activity across the platform
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScrollText className="h-5 w-5 text-purple-500" />
            Recent Activity ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No activity logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Timestamp
                      </div>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        User
                      </div>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        IP Address
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.userName || log.userEmail ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.userName || 'Unknown'}
                            </div>
                            {log.userEmail && (
                              <div className="text-xs text-gray-500">
                                {log.userEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 font-mono">
                          {log.ipAddress || '--'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
