const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME
});

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../database/migrations/20260324_comment_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('--- Running Comment System Migration ---');
    await pool.query(sql);
    console.log('✅ Migration completed successfully');
    
  } catch (err) {
    console.error('❌ Error running migration:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
