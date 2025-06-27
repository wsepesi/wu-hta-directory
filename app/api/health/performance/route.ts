import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get server-side performance metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
      },
      node: process.version,
      env: process.env.NODE_ENV,
    };
    
    return NextResponse.json({
      status: 'healthy',
      metrics,
    });
  } catch {
    return NextResponse.json(
      { status: 'error', error: 'Failed to get performance metrics' },
      { status: 500 }
    );
  }
}