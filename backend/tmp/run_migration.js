const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'patch_next_gen.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Starting migration...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
