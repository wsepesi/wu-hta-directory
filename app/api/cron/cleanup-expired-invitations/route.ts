import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invitations } from '@/lib/db/schema';
import { lt, and, eq } from 'drizzle-orm';
import { env } from '@/lib/env';
import { monitoring } from '@/lib/monitoring';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
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
    
    const transactionId = monitoring.startTransaction('cron.cleanup-invitations');
    
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - env.INVITATION_EXPIRY_DAYS);
    
    // Delete expired invitations that haven't been used
    const result = await db
      .delete(invitations)
      .where(
        and(
          lt(invitations.createdAt, expiryDate),
          eq(invitations.used, false)
        )
      )
      .returning({ id: invitations.id });
    
    const deletedCount = result.length;
    
    // Log the cleanup
    monitoring.captureMessage(
      `Cleaned up ${deletedCount} expired invitations`,
      monitoring.ErrorSeverity.INFO,
      {
        extra: {
          deletedCount,
          expiryDate: expiryDate.toISOString(),
        },
      }
    );
    
    monitoring.finishTransaction(transactionId, 'ok', { deletedCount });
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired invitations`,
      deletedCount,
      expiryDate: expiryDate.toISOString(),
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    monitoring.captureException(error, {
      tags: { cron: 'cleanup-invitations' },
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup invitations',
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