require('dotenv').config();
const { Pool } = require('pg');

async function auditSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  });

  try {
    const tables = ['media_files', 'media_folders', 'books', 'members', 'news'];
    console.log('--- DATABASE SCHEMA AUDIT ---');
    
    for (const table of tables) {
      const { rows } = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      console.log(`\nTable: ${table}`);
      if (rows.length === 0) {
        console.log('  ❌ TABLE MISSING');
      } else {
        console.log('  Columns:', rows.map(r => r.column_name).join(', '));
      }
    }
    console.log('\n--- AUDIT COMPLETED ---');
  } catch (err) {
    console.error('Audit Error:', err.message);
  } finally {
    await pool.end();
  }
}

auditSchema();
