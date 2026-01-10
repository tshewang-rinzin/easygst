import { db } from '@/lib/db/drizzle';
import { activityLogs, users } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

export interface ActivityLogEntry {
  id: string;
  action: string;
  timestamp: Date;
  ipAddress: string | null;
  userName: string | null;
  userEmail: string | null;
}

export interface ActivitySummary {
  totalActivities: number;
  uniqueUsers: number;
  mostCommonAction: string | null;
  todayCount: number;
}

/**
 * Get activity logs for the team
 */
export async function getActivityLogs(startDate?: Date, endDate?: Date, limit: number = 100) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [eq(activityLogs.teamId, team.id)];

  if (startDate) {
    conditions.push(gte(activityLogs.timestamp, startDate));
  }

  if (endDate) {
    conditions.push(lte(activityLogs.timestamp, endDate));
  }

  const logs = await db
    .select({
      log: activityLogs,
      user: users,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit);

  const results: ActivityLogEntry[] = logs.map(({ log, user }) => ({
    id: log.id,
    action: log.action,
    timestamp: log.timestamp,
    ipAddress: log.ipAddress,
    userName: user?.name || null,
    userEmail: user?.email || null,
  }));

  return results;
}

/**
 * Get activity summary statistics
 */
export async function getActivitySummary(startDate?: Date, endDate?: Date): Promise<ActivitySummary> {
  const team = await getTeamForUser();
  if (!team) {
    return {
      totalActivities: 0,
      uniqueUsers: 0,
      mostCommonAction: null,
      todayCount: 0,
    };
  }

  const conditions = [eq(activityLogs.teamId, team.id)];

  if (startDate) {
    conditions.push(gte(activityLogs.timestamp, startDate));
  }

  if (endDate) {
    conditions.push(lte(activityLogs.timestamp, endDate));
  }

  const logs = await db
    .select()
    .from(activityLogs)
    .where(and(...conditions));

  // Calculate statistics
  const totalActivities = logs.length;
  const uniqueUsers = new Set(logs.map(log => log.userId).filter(Boolean)).size;

  // Find most common action
  const actionCounts = new Map<string, number>();
  logs.forEach(log => {
    actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
  });

  let mostCommonAction = null;
  let maxCount = 0;
  actionCounts.forEach((count, action) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonAction = action;
    }
  });

  // Count today's activities
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  }).length;

  return {
    totalActivities,
    uniqueUsers,
    mostCommonAction,
    todayCount,
  };
}

/**
 * Get activity breakdown by action type
 */
export async function getActivityBreakdown(startDate?: Date, endDate?: Date) {
  const team = await getTeamForUser();
  if (!team) return [];

  const conditions = [eq(activityLogs.teamId, team.id)];

  if (startDate) {
    conditions.push(gte(activityLogs.timestamp, startDate));
  }

  if (endDate) {
    conditions.push(lte(activityLogs.timestamp, endDate));
  }

  const logs = await db
    .select()
    .from(activityLogs)
    .where(and(...conditions));

  // Group by action
  const actionCounts = new Map<string, number>();
  logs.forEach(log => {
    actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
  });

  // Convert to array and sort by count
  const breakdown = Array.from(actionCounts.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count);

  return breakdown;
}
