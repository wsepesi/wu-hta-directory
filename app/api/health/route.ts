import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from '@vercel/postgres';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: false,
      email: false,
      auth: false,
    },
    details: {} as Record<string, any>,
  };

  try {
    // Check database connection
    const startDb = Date.now();
    await sql`SELECT 1`;
    health.checks.database = true;
    health.details.database = {
      responseTime: Date.now() - startDb,
      status: 'connected',
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.details.database = {
      status: 'disconnected',
      error: 'Database connection failed',
    };
  }

  // Check email configuration
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    health.checks.email = true;
    health.details.email = {
      status: 'configured',
      fromEmail: process.env.RESEND_FROM_EMAIL,
    };
  } else {
    health.details.email = {
      status: 'not configured',
      error: 'Missing email configuration',
    };
  }

  // Check auth configuration
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL) {
    health.checks.auth = true;
    health.details.auth = {
      status: 'configured',
      url: process.env.NEXTAUTH_URL,
    };
  } else {
    health.details.auth = {
      status: 'not configured',
      error: 'Missing auth configuration',
    };
  }

  // Overall health status
  const allChecksPass = Object.values(health.checks).every(check => check);
  if (!allChecksPass) {
    health.status = 'degraded';
  }

  // Add environment info
  health.details.environment = {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  };

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}