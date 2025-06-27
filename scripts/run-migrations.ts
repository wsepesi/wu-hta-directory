#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { createClient } from '@vercel/postgres';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
// import { env } from '../lib/env-validation';

dotenv.config({ path: '.env.local' });

console.log('Attempting to use connection string:', process.env.POSTGRES_URL);

// Create client with connection string
const client = createClient({
  connectionString: process.env.POSTGRES_URL,
});

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function ensureMigrationsTable() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      checksum VARCHAR(64) NOT NULL,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

async function getMigrationChecksum(content: string): Promise<string> {
  return crypto.createHash('sha256').update(content).digest('hex');
}

interface MigrationRow {
  filename: string;
}

async function getExecutedMigrations(): Promise<Set<string>> {
  const result = await client.sql`
    SELECT filename FROM schema_migrations
  `;
  return new Set(result.rows.map((row) => (row as MigrationRow).filename));
}

async function getPendingMigrations(): Promise<string[]> {
  try {
    await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  const files = await fs.readdir(MIGRATIONS_DIR);
  const migrationFiles = files
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure migrations run in order
  
  const executed = await getExecutedMigrations();
  return migrationFiles.filter(file => !executed.has(file));
}

async function runMigration(filename: string) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const content = await fs.readFile(filepath, 'utf-8');
  const checksum = await getMigrationChecksum(content);
  
  // Start transaction
  try {
    await client.sql`BEGIN`;
    
    // Execute migration
    await client.query(content);
    
    // Record migration
    await client.sql`
      INSERT INTO schema_migrations (filename, checksum)
      VALUES (${filename}, ${checksum})
    `;
    
    await client.sql`COMMIT`;
    log(`✓ Applied migration: ${filename}`, 'green');
  } catch (error) {
    await client.sql`ROLLBACK`;
    throw error;
  }
}

async function createMigration(name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const filename = `${timestamp}-${name.toLowerCase().replace(/\s+/g, '-')}.sql`;
  const filepath = path.join(MIGRATIONS_DIR, filename);
  
  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
-- Remember to include both UP and DOWN migrations if needed

-- UP Migration
BEGIN;

-- Your schema changes here

COMMIT;

-- DOWN Migration (commented out by default)
-- BEGIN;
-- -- Your rollback SQL here
-- COMMIT;
`;
  
  await fs.writeFile(filepath, template);
  log(`✓ Created migration: ${filename}`, 'green');
  return filename;
}

async function runMigrations() {
  log('🔄 Running database migrations...', 'blue');
  
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    // Get pending migrations
    const pending = await getPendingMigrations();
    
    if (pending.length === 0) {
      log('✓ No pending migrations', 'green');
      return;
    }
    
    log(`Found ${pending.length} pending migrations`, 'yellow');
    
    // Run each migration
    for (const migration of pending) {
      try {
        await runMigration(migration);
      } catch (error) {
        log(`✗ Failed to apply migration: ${migration}`, 'red');
        console.error(error);
        throw error;
      }
    }
    
    log(`\n✅ Successfully applied ${pending.length} migrations`, 'green');
    
  } catch (error) {
    log('\n❌ Migration failed!', 'red');
    console.error(error);
    throw error;
  }
}

async function rollbackMigration() {
  log('🔄 Rolling back last migration...', 'blue');
  
  try {
    // Get last migration
    const result = await client.sql`
      SELECT filename 
      FROM schema_migrations 
      ORDER BY executed_at DESC 
      LIMIT 1
    `;
    
    if (result.rows.length === 0) {
      log('No migrations to rollback', 'yellow');
      return;
    }
    
    const lastMigration = (result.rows[0] as MigrationRow).filename;
    const filepath = path.join(MIGRATIONS_DIR, lastMigration);
    const content = await fs.readFile(filepath, 'utf-8');
    
    // Look for DOWN migration section
    const downMatch = content.match(/-- DOWN Migration[\s\S]*?BEGIN;([\s\S]*?)COMMIT;/);
    
    if (!downMatch || !downMatch[1]) {
      log(`No rollback found in migration: ${lastMigration}`, 'red');
      throw new Error('Rollback SQL not found');
    }
    
    const rollbackSql = downMatch[1].trim();
    if (!rollbackSql) {
      log(`Empty rollback SQL in migration: ${lastMigration}`, 'red');
      throw new Error('Rollback SQL is empty');
    }
    
    // Execute rollback
    await client.sql`BEGIN`;
    try {
      await client.query(rollbackSql);
      await client.sql`
        DELETE FROM schema_migrations 
        WHERE filename = ${lastMigration}
      `;
      await client.sql`COMMIT`;
      log(`✓ Rolled back migration: ${lastMigration}`, 'green');
    } catch (error) {
      await client.sql`ROLLBACK`;
      throw error;
    }
    
  } catch (error) {
    log('\n❌ Rollback failed!', 'red');
    console.error(error);
    throw error;
  }
}

async function migrationStatus() {
  log('📊 Migration Status', 'blue');
  
  try {
    await ensureMigrationsTable();
    
    // Get all migrations
    const allFiles = await fs.readdir(MIGRATIONS_DIR);
    const migrationFiles = allFiles.filter(file => file.endsWith('.sql')).sort();
    
    // Get executed migrations
    const result = await client.sql`
      SELECT filename, executed_at 
      FROM schema_migrations
      ORDER BY executed_at
    `;
    
    interface MigrationStatusRow {
      filename: string;
      executed_at: Date;
    }
    
    const executed = new Map(
      result.rows.map((row) => {
        const statusRow = row as MigrationStatusRow;
        return [statusRow.filename, statusRow.executed_at];
      })
    );
    
    log('\nMigrations:', 'yellow');
    for (const file of migrationFiles) {
      const executedAt = executed.get(file);
      if (executedAt) {
        log(`  ✓ ${file} (executed: ${new Date(executedAt).toLocaleString()})`, 'green');
      } else {
        log(`  ✗ ${file} (pending)`, 'yellow');
      }
    }
    
    const pending = migrationFiles.filter(file => !executed.has(file));
    log(`\nTotal: ${migrationFiles.length} | Executed: ${executed.size} | Pending: ${pending.length}`, 'blue');
    
  } catch (error) {
    log('\n❌ Failed to get migration status!', 'red');
    console.error(error);
    throw error;
  }
}

// CLI handling
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'run':
    case 'up':
      runMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'rollback':
    case 'down':
      rollbackMigration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'create':
      if (!arg) {
        log('Please provide a migration name', 'red');
        process.exit(1);
      }
      createMigration(arg)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'status':
      migrationStatus()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    default:
      log('Usage:', 'yellow');
      log('  npm run migrate:run           # Run pending migrations', 'yellow');
      log('  npm run migrate:rollback      # Rollback last migration', 'yellow');
      log('  npm run migrate:create NAME   # Create new migration', 'yellow');
      log('  npm run migrate:status        # Show migration status', 'yellow');
      process.exit(1);
  }
}

export { runMigrations, rollbackMigration, createMigration, migrationStatus };