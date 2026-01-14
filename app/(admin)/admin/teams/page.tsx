import { db } from '@/lib/db/drizzle';
import { teams, teamMembers, users, invoices } from '@/lib/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, FileText, Calendar } from 'lucide-react';
import { getPlatformAdmin } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

async function getTeams() {
  const allTeams = await db
    .select({
      team: teams,
      memberCount: count(teamMembers.id),
    })
    .from(teams)
    .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .groupBy(teams.id)
    .orderBy(desc(teams.createdAt));

  // Get invoice counts for each team
  const teamsWithInvoices = await Promise.all(
    allTeams.map(async (t) => {
      const [invoiceCount] = await db
        .select({ count: count() })
        .from(invoices)
        .where(eq(invoices.teamId, t.team.id));

      return {
        ...t,
        invoiceCount: invoiceCount.count,
      };
    })
  );

  return teamsWithInvoices;
}

export default async function AdminTeamsPage() {
  const admin = await getPlatformAdmin();
  if (!admin) {
    redirect('/admin/login');
  }

  const allTeams = await getTeams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <p className="text-gray-500 mt-1">
          Manage all business tenants on the platform
        </p>
      </div>

      <Card>
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-purple-500" />
            All Teams ({allTeams.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {allTeams.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No teams found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoices
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TPN
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allTeams.map((row) => (
                    <tr key={row.team.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {row.team.name}
                            </div>
                            {row.team.businessName && (
                              <div className="text-sm text-gray-500">
                                {row.team.businessName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{row.memberCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{row.invoiceCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.team.tpn ? (
                          <Badge variant="secondary">{row.team.tpn}</Badge>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(row.team.createdAt).toLocaleDateString()}
                        </div>
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
