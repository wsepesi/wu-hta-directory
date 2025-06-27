const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function applyIndexes() {
  console.log('🔍 Applying database indexes...\n');
  
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Read the SQL file
    const indexSql = fs.readFileSync(path.join(__dirname, 'add-indexes.sql'), 'utf-8');
    
    // Split by semicolons and filter out empty statements
    const statements = indexSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const statement of statements) {
      try {
        await client.query(statement);
        
        if (statement.toUpperCase().startsWith('ANALYZE')) {
          console.log(`✓ Analyzed table: ${statement.split(' ')[1]}`);
        } else {
          const indexMatch = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/i);
          const indexName = indexMatch ? indexMatch[1] : 'unknown';
          console.log(`✓ Created/verified index: ${indexName}`);
          created++;
        }
      } catch (error) {
        if (error.message?.includes('already exists')) {
          console.log(`○ Index already exists`);
          skipped++;
        } else {
          console.error(`✗ Failed: ${error.message}`);
          failed++;
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  - Indexes created/verified: ${created}`);
    console.log(`  - Indexes skipped: ${skipped}`);
    console.log(`  - Failed operations: ${failed}`);

    // Verify critical indexes
    console.log('\n🔍 Verifying critical indexes...');
    const criticalIndexes = [
      'idx_ta_assignments_user_id',
      'idx_ta_assignments_course_offering_id',
      'idx_course_offerings_course_id',
      'idx_course_offerings_professor_id',
      'idx_users_role',
      'idx_users_name'
    ];

    const result = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname = ANY($1)
    `, [criticalIndexes]);

    const foundIndexNames = result.rows.map(row => row.indexname);
    
    console.log(`\nFound ${foundIndexNames.length}/${criticalIndexes.length} critical indexes:`);
    
    criticalIndexes.forEach(idx => {
      if (foundIndexNames.includes(idx)) {
        console.log(`  ✓ ${idx}`);
      } else {
        console.log(`  ✗ ${idx} - MISSING!`);
      }
    });

    if (foundIndexNames.length < criticalIndexes.length) {
      console.log('\n⚠️  Some critical indexes are missing!');
      process.exit(1);
    } else {
      console.log('\n✅ All critical indexes are present!');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyIndexes();