import { getDb } from './connection';
import { dbLogger } from '@/lib/logger';
import postgres from 'postgres';

// Export the lazy-loaded database instance
export const db = getDb();

// Export all schema types for convenience
export * from './schema';

// Create a query client for health checks
let queryClient: postgres.Sql | null = null;

function getQueryClient(): postgres.Sql {
  if (!queryClient) {
    const connectionString = process.env.POSTGRES_URL || '';
    const maxConnections = process.env.DATABASE_MAX_CONNECTIONS ? parseInt(process.env.DATABASE_MAX_CONNECTIONS) : 10;
    const connectionTimeout = process.env.DATABASE_CONNECTION_TIMEOUT ? parseInt(process.env.DATABASE_CONNECTION_TIMEOUT) / 1000 : 10;
    
    queryClient = postgres(connectionString, {
      max: maxConnections,
      idle_timeout: 20,
      connect_timeout: connectionTimeout,
      ssl: connectionString.includes('sslmode=require') ? 'require' : false,
      prepare: false,
    });
  }
  return queryClient;
}

// Database connection check with retry logic
export async function checkDatabaseConnection(retries = 3): Promise<boolean> {
  dbLogger.info('Checking database connection', { retries });
  
  for (let i = 0; i < retries; i++) {
    try {
      const startTime = Date.now();
      const client = getQueryClient();
      await client`SELECT 1`;
      const duration = Date.now() - startTime;
      
      dbLogger.info('Database connection successful', { 
        attempt: i + 1, 
        duration,
      });
      return true;
    } catch (error) {
      dbLogger.error(`Database connection attempt ${i + 1} failed`, error, {
        attempt: i + 1,
        retriesRemaining: retries - i - 1,
      });
      
      if (i < retries - 1) {
        const backoffMs = Math.pow(2, i) * 1000;
        dbLogger.info(`Waiting ${backoffMs}ms before retry`, { 
          attempt: i + 1,
          backoffMs,
        });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  
  dbLogger.error('Database connection failed after all retries', undefined, { retries });
  return false;
}

// Health check for database
export async function getDatabaseHealth() {
  try {
    const start = Date.now();
    const client = getQueryClient();
    const result = await client`SELECT version(), current_timestamp`;
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
      version: result[0]?.version,
      timestamp: result[0]?.current_timestamp,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}