'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Download, User, TrendingUp } from 'lucide-react';
import useSWR from 'swr';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ActivityLogEntry {
  id: number;
  action: string;
  timestamp: string;
  ipAddress: string | null;
  userName: string | null;
  userEmail: string | null;
}

interface ActivitySummary {
  totalActivities: number;
  uniqueUsers: number;
  mostCommonAction: string | null;
  todayCount: number;
}

interface ActivityBreakdown {
  action: string;
  count: number;
}

export default function ActivityReportPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(100);

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());
    return `/api/reports/activity?${params.toString()}`;
  };

  const { data, isLoading } = useSWR<{
    logs: ActivityLogEntry[];
    summary: ActivitySummary;
    breakdown: ActivityBreakdown[];
  }>(buildUrl(), fetcher);

  const handleExport = () => {
    if (!data?.logs) return;

    const headers = ['Timestamp', 'User', 'Email', 'Action', 'IP Address'];
    const rows = data.logs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.userName || 'N/A',
      log.userEmail || 'N/A',
      log.action,
      log.ipAddress || 'N/A',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleApplyFilters = () => {
    // SWR will automatically refetch when the URL changes
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Activity Report</h1>
          <p className="text-muted-foreground">Track user activities and system events</p>
        </div>
        <Button onClick={handleExport} disabled={!data?.logs || data.logs.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Limit</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                min="1"
                max="1000"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleApplyFilters} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Total Activities</div>
              </div>
              <div className="text-2xl font-bold">{data.summary.totalActivities}</div>
              <div className="text-xs text-muted-foreground mt-1">all time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Unique Users</div>
              </div>
              <div className="text-2xl font-bold text-blue-600">{data.summary.uniqueUsers}</div>
              <div className="text-xs text-muted-foreground mt-1">active users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Most Common</div>
              </div>
              <div className="text-lg font-bold text-green-600 truncate">
                {data.summary.mostCommonAction || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">action type</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Today</div>
              </div>
              <div className="text-2xl font-bold text-orange-600">{data.summary.todayCount}</div>
              <div className="text-xs text-muted-foreground mt-1">activities today</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Breakdown */}
      {data?.breakdown && data.breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Action Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Action</th>
                    <th className="text-right p-2">Count</th>
                    <th className="text-right p-2">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.breakdown.map((item, index) => {
                    const percentage =
                      data.summary.totalActivities > 0
                        ? ((item.count / data.summary.totalActivities) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{item.action}</td>
                        <td className="p-2 text-right">{item.count}</td>
                        <td className="p-2 text-right">
                          <Badge variant="outline">{percentage}%</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : !data?.logs || data.logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium text-lg mb-2">No activities found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Timestamp</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Action</th>
                    <th className="text-left p-2">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{log.userName || 'Unknown'}</span>
                          {log.userEmail && (
                            <span className="text-xs text-muted-foreground">{log.userEmail}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{log.action}</Badge>
                      </td>
                      <td className="p-2 font-mono text-xs">{log.ipAddress || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Tracking Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-blue-900">
          <p>• All user actions are logged for audit and compliance purposes</p>
          <p>• Activity logs help track changes and identify suspicious behavior</p>
          <p>• Use date filters to analyze activity patterns over specific periods</p>
          <p>• Export logs for external analysis or record-keeping</p>
          <p>• Logs are retained according to your data retention policy</p>
        </CardContent>
      </Card>
    </div>
  );
}
