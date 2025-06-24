import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';
import { env } from '@/lib/env';

// Configure connection pool
sql.setMaxConnections(env.DATABASE_MAX_CONNECTIONS);
sql.setConnectionTimeout(env.DATABASE_CONNECTION_TIMEOUT);

// Create a database connection with proper error handling
let dbInstance: ReturnType<typeof drizzle> | null = null;

function createDatabaseConnection() {
  try {
    return drizzle(sql, { 
      schema,
      logger: env.LOG_SQL_QUERIES,
    });
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw new Error('Database connection failed');
  }
}

// Singleton pattern for database connection
export function getDb() {
  if (!dbInstance) {
    dbInstance = createDatabaseConnection();
  }
  return dbInstance;
}

// Export the db instance
export const db = getDb();

// Export all schema types for convenience
export * from './schema';

// Database connection check with retry logic
export async function checkDatabaseConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await sql`SELECT 1`;
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  return false;
}

// Health check for database
export async function getDatabaseHealth() {
  try {
    const start = Date.now();
    const result = await sql`SELECT version(), current_timestamp`;
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
      version: result.rows[0]?.version,
      timestamp: result.rows[0]?.current_timestamp,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}