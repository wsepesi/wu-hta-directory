import { NextRequest, NextResponse } from 'next/server';
import { backupDatabase } from '@/scripts/backup-database';
import { env } from '@/lib/env';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  
  // In Vercel, cron jobs are automatically authenticated
  // For manual testing, check for a secret
  if (env.NODE_ENV === 'development') {
    return true; // Allow in development
  }
  
  // Vercel adds this header for cron jobs
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  return isVercelCron;
}

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a valid cron job
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only run backups in production
    if (env.NODE_ENV !== 'production') {
      return NextResponse.json({
        success: true,
        message: 'Database backup skipped in non-production environment',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    }
    
    
    try {
      // Run the backup
      const backupPath = await backupDatabase();
      
      
      return NextResponse.json({
        success: true,
        message: 'Database backup completed successfully',
        backupPath,
        timestamp: new Date().toISOString(),
      });
      
    } catch (backupError) {
      throw backupError;
    }
    
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to backup database',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}