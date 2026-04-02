require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { pool } = require('../backend/src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, '../backend/database/migrations/20260319_reader_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running migration...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('Message:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    if (error.where) console.error('Where:', error.where);
    process.exit(1);
  }
}

runMigration();
