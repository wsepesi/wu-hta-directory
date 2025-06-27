import { dbLogger } from '@/lib/logger';

// Default timeout for database queries (5 seconds)
const DEFAULT_QUERY_TIMEOUT = 5000;

export class QueryTimeoutError extends Error {
  constructor(message: string = 'Database query timed out') {
    super(message);
    this.name = 'QueryTimeoutError';
  }
}

/**
 * Wraps a database query with a timeout
 * If the query doesn't complete within the timeout, it throws a QueryTimeoutError
 */
export async function withTimeout<T>(
  queryPromise: Promise<T>,
  timeoutMs: number = DEFAULT_QUERY_TIMEOUT,
  queryName?: string
): Promise<T> {
  const startTime = Date.now();
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const error = new QueryTimeoutError(`Query timed out after ${timeoutMs}ms`);
      dbLogger.error(`Query timeout: ${queryName || 'Unknown query'}`, error, {
        timeoutMs,
        queryName,
      });
      reject(error);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    // Log slow queries
    if (duration > timeoutMs * 0.8) {
      dbLogger.warn(`Slow query detected: ${queryName || 'Unknown query'}`, {
        duration,
        timeoutMs,
        queryName,
      });
    } else {
      dbLogger.debug(`Query completed: ${queryName || 'Unknown query'}`, {
        duration,
        queryName,
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    dbLogger.error(`Query failed: ${queryName || 'Unknown query'}`, error, {
      duration,
      queryName,
    });
    throw error;
  }
}

/**
 * Wraps a database query with timeout and empty fallback
 * Returns empty array if query times out or fails
 */
export async function withTimeoutFallback<T>(
  queryPromise: Promise<T[]>,
  fallback: T[] = [],
  timeoutMs: number = DEFAULT_QUERY_TIMEOUT,
  queryName?: string
): Promise<T[]> {
  const startTime = Date.now();
  
  try {
    return await withTimeout(queryPromise, timeoutMs, queryName);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof QueryTimeoutError) {
      dbLogger.warn(`Query timeout handled with fallback: ${queryName || 'Unknown query'}`, {
        duration,
        timeoutMs,
        queryName,
        fallbackUsed: true,
      });
    } else {
      dbLogger.error(`Query error handled with fallback: ${queryName || 'Unknown query'}`, error, {
        duration,
        queryName,
        fallbackUsed: true,
      });
    }
    
    return fallback;
  }
}