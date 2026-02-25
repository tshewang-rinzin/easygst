import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // Check database connection
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database = { status: 'healthy', latency: Date.now() - dbStart };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: 'Database connection failed',
    };
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  checks.memory = {
    status: heapUsedMB < 512 ? 'healthy' : 'warning',
    latency: undefined,
  };

  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');
  const status = allHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      checks,
      memory: {
        heapUsedMB,
        heapTotalMB,
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
      },
      latency: Date.now() - start,
    },
    { status }
  );
}
