require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runFullSync() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  });

  try {
    console.log('--- STARTING 100% DB SYNCHRONIZATION ---');
    const sqlPath = path.join(__dirname, 'full_restore_sync_v3.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing master restoration script...');
    await pool.query(sql);
    
    console.log('✓ ALL Missing Tables Restored');
    console.log('✓ ALL Missing Columns Synced');
    console.log('✓ Constraints & Triggers Applied');
    console.log('--- 100% SYNCHRONIZATION COMPLETED ---');

  } catch (err) {
    console.error('❌ Sync Failed:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
    if (err.hint) console.error('Hint:', err.hint);
  } finally {
    await pool.end();
  }
}

runFullSync();
