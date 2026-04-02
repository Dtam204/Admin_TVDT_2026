const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../src/migrations/v17_book_advanced_features.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('--- Running Migration: Advanced Book Features ---');
    await pool.query(sql);
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
