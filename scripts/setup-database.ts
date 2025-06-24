#!/usr/bin/env node
import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import * as schema from '../lib/db/schema';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../lib/env';

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

async function runMigration(migrationPath: string) {
  try {
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    await sql.query(migrationSQL);
    log(`✓ Applied migration: ${path.basename(migrationPath)}`, 'green');
  } catch (error) {
    log(`✗ Failed to apply migration: ${path.basename(migrationPath)}`, 'red');
    throw error;
  }
}

async function setupDatabase() {
  log('🚀 Starting database setup...', 'blue');
  
  try {
    // Check database connection
    log('Checking database connection...', 'yellow');
    const result = await sql`SELECT version()`;
    log(`✓ Connected to database: ${result.rows[0].version}`, 'green');
    
    // Run migrations
    log('\nRunning migrations...', 'yellow');
    const migrationsDir = path.join(process.cwd(), 'scripts');
    
    // Apply main migration
    const migrationPath = path.join(migrationsDir, 'migrate.sql');
    if (await fs.access(migrationPath).then(() => true).catch(() => false)) {
      await runMigration(migrationPath);
    }
    
    // Apply indexes
    const indexesPath = path.join(migrationsDir, 'add-indexes.sql');
    if (await fs.access(indexesPath).then(() => true).catch(() => false)) {
      await runMigration(indexesPath);
    }
    
    // Seed initial data (only in development/staging)
    if (env.NODE_ENV !== 'production') {
      log('\nSeeding initial data...', 'yellow');
      const seedPath = path.join(migrationsDir, 'seed.sql');
      if (await fs.access(seedPath).then(() => true).catch(() => false)) {
        await runMigration(seedPath);
      }
    }
    
    // Verify tables exist
    log('\nVerifying database schema...', 'yellow');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const expectedTables = [
      'users',
      'courses',
      'professors',
      'course_offerings',
      'ta_assignments',
      'invitations',
      'activity_logs',
    ];
    
    const existingTables = tables.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      log(`✗ Missing tables: ${missingTables.join(', ')}`, 'red');
      throw new Error('Database schema is incomplete');
    }
    
    log(`✓ All ${expectedTables.length} tables verified`, 'green');
    
    // Display summary
    log('\n📊 Database Setup Summary:', 'blue');
    log(`Environment: ${env.NODE_ENV}`, 'yellow');
    log(`Database: ${env.POSTGRES_DATABASE || 'default'}`, 'yellow');
    log(`Tables: ${existingTables.length}`, 'yellow');
    
    log('\n✅ Database setup completed successfully!', 'green');
    
  } catch (error) {
    log('\n❌ Database setup failed!', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { setupDatabase };