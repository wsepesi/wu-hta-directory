#!/usr/bin/env node
import { createClient } from '@vercel/postgres';
import * as fs from 'fs/promises';
import * as path from 'path';
import { env } from '../lib/env-validation';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Create pooled client
const client = createClient();

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

async function ensureBackupDirectory() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    log(`Failed to create backup directory: ${error}`, 'red');
    throw error;
  }
}

interface TableRow {
  [key: string]: unknown;
}

async function getTableData(tableName: string): Promise<TableRow[]> {
  const result = await client.query(`SELECT * FROM ${tableName}`);
  return result.rows as TableRow[];
}

async function backupDatabase() {
  log('🔄 Starting database backup...', 'blue');
  
  try {
    // Ensure backup directory exists
    await ensureBackupDirectory();
    
    // Get all tables
    const tablesResult = await client.sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const tables = tablesResult.rows.map((row) => (row as { table_name: string }).table_name);
    log(`Found ${tables.length} tables to backup`, 'yellow');
    
    // Create backup data structure
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: env.POSTGRES_DATABASE || 'default',
      tables: {} as Record<string, TableRow[]>,
    };
    
    // Backup each table
    for (const table of tables) {
      try {
        log(`Backing up table: ${table}...`, 'yellow');
        const data = await getTableData(table);
        backup.tables[table] = data;
        log(`✓ Backed up ${data.length} rows from ${table}`, 'green');
      } catch (error) {
        log(`✗ Failed to backup table ${table}: ${error}`, 'red');
        throw error;
      }
    }
    
    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${env.NODE_ENV}-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    // Write backup to file
    await fs.writeFile(filepath, JSON.stringify(backup, null, 2));
    log(`\n✅ Backup saved to: ${filepath}`, 'green');
    
    // Clean up old backups (keep last 7 days)
    await cleanupOldBackups();
    
    // Display summary
    log('\n📊 Backup Summary:', 'blue');
    log(`Total tables: ${tables.length}`, 'yellow');
    log(`Total rows: ${Object.values(backup.tables).reduce((sum, rows) => sum + rows.length, 0)}`, 'yellow');
    log(`File size: ${(await fs.stat(filepath)).size / 1024 / 1024} MB`, 'yellow');
    
    return filepath;
    
  } catch (error) {
    log('\n❌ Database backup failed!', 'red');
    console.error(error);
    throw error;
  }
}

async function cleanupOldBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    for (const file of files) {
      if (file.startsWith('backup-') && file.endsWith('.json')) {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime.getTime() < sevenDaysAgo) {
          await fs.unlink(filepath);
          log(`Deleted old backup: ${file}`, 'yellow');
        }
      }
    }
  } catch (error) {
    log(`Warning: Failed to cleanup old backups: ${error}`, 'yellow');
  }
}

async function restoreDatabase(backupFile: string) {
  log('🔄 Starting database restore...', 'blue');
  
  try {
    // Read backup file
    const backupPath = path.isAbsolute(backupFile) ? backupFile : path.join(BACKUP_DIR, backupFile);
    const backupData = JSON.parse(await fs.readFile(backupPath, 'utf-8'));
    
    log(`Restoring from backup: ${backupPath}`, 'yellow');
    log(`Backup created: ${backupData.timestamp}`, 'yellow');
    log(`Environment: ${backupData.environment}`, 'yellow');
    
    // Confirm restore in production
    if (env.NODE_ENV === 'production') {
      log('\n⚠️  WARNING: You are about to restore a production database!', 'red');
      log('This will DELETE all existing data. Type "CONFIRM" to proceed:', 'red');
      
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      const answer = await new Promise<string>(resolve => {
        rl.question('> ', resolve);
      });
      rl.close();
      
      if (answer !== 'CONFIRM') {
        log('Restore cancelled.', 'yellow');
        return;
      }
    }
    
    // Disable foreign key checks
    await client.sql`SET session_replication_role = 'replica'`;
    
    // Clear existing data
    for (const table of Object.keys(backupData.tables).reverse()) {
      log(`Clearing table: ${table}...`, 'yellow');
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
    
    // Restore data
    for (const [table, rows] of Object.entries(backupData.tables)) {
      const tableRows = rows as TableRow[];
      if (tableRows.length === 0) continue;
      
      log(`Restoring ${tableRows.length} rows to ${table}...`, 'yellow');
      
      // Build insert query
      const columns = Object.keys(tableRows[0]);
      const values = tableRows.map((row: TableRow) => 
        `(${columns.map(col => {
          const value = row[col];
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (value instanceof Date) return `'${value.toISOString()}'`;
          return String(value);
        }).join(', ')})`
      ).join(', ');
      
      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values}`;
      await client.query(query);
      
      log(`✓ Restored ${table}`, 'green');
    }
    
    // Re-enable foreign key checks
    await client.sql`SET session_replication_role = 'origin'`;
    
    log('\n✅ Database restore completed successfully!', 'green');
    
  } catch (error) {
    log('\n❌ Database restore failed!', 'red');
    console.error(error);
    throw error;
  }
}

// CLI handling
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'backup') {
    backupDatabase()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'restore' && process.argv[3]) {
    restoreDatabase(process.argv[3])
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    log('Usage:', 'yellow');
    log('  npm run db:backup        # Create a backup', 'yellow');
    log('  npm run db:restore FILE  # Restore from backup', 'yellow');
    process.exit(1);
  }
}

export { backupDatabase, restoreDatabase };