require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  });

  try {
    console.log('--- EXECUTING DEEP SYNC - FIXING MISSING COLUMNS ---');
    const sqlPath = path.join(__dirname, 'fix_all_missing_columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('✓ ALL missing columns added using ALTER TABLE');
    console.log('--- DEEP SYNC COMPLETED ---');

  } catch (err) {
    console.error('❌ Fix Failed:', err.message);
  } finally {
    await pool.end();
  }
}

runFix();
