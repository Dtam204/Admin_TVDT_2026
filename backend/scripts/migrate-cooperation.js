const { pool } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const migrationPath = path.join(__dirname, '../database/migrations/20260330_add_cooperation_status.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('--- Migrating books table to add cooperation_status ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migration successful!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
  } finally {
    client.release();
    process.exit();
  }
}

runMigration();
