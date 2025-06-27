import postgres from 'postgres';
import { drizzle as pgDrizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

type DatabaseConnection = PostgresJsDatabase<typeof schema>;

let db: DatabaseConnection | null = null;
let connectionType: 'production' | 'development' | 'test' = 'development';

export function getConnectionType(): string {
  return connectionType;
}

export function createConnection(): DatabaseConnection {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  
  if (isTest) {
    connectionType = 'test';
    // For tests, use a test database or mocked connection
    const testUrl = process.env.TEST_DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://test:test@localhost:5432/test';
    const sql = postgres(testUrl, {
      max: 1,
      idle_timeout: 0,
      connect_timeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '2000', 10),
    });
    return pgDrizzle(sql, { schema });
  }
  
  if (isProduction) {
    connectionType = 'production';
    const databaseUrl = process.env.POSTGRES_URL;
    if (!databaseUrl) {
      throw new Error('POSTGRES_URL is not set in production environment');
    }
    const sql = postgres(databaseUrl, {
      max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20', 10),
      idle_timeout: 20,
      connect_timeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000', 10),
      ssl: 'require',
    });
    return pgDrizzle(sql, { schema });
  }
  
  // Development
  connectionType = 'development';
  const databaseUrl = process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error('POSTGRES_URL is not set');
  }
  
  const sql = postgres(databaseUrl, {
    max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20', 10),
    idle_timeout: 20,
    connect_timeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000', 10),
  });
  
  return pgDrizzle(sql, { schema });
}

export function getDb(): DatabaseConnection {
  if (!db) {
    db = createConnection();
  }
  return db;
}

export function resetDb(): void {
  db = null;
}

// For testing purposes
export function setDb(newDb: DatabaseConnection): void {
  db = newDb;
}

export { schema };