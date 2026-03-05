import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    time: new Date().toISOString(),
    node: process.version,
    env: {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasBaseUrl: !!process.env.BASE_URL,
      nodeEnv: process.env.NODE_ENV,
    }
  });
}
