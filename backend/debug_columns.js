require('dotenv').config();
const { Pool } = require('pg');

async function debugColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  });

  try {
    console.log('--- DEBUGGING media_files COLUMNS ---');
    const { rows } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'media_files'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns found:', rows.map(r => r.column_name).join(', '));
    
    if (rows.length === 0) {
      console.log('❌ TABLE media_files DOES NOT EXIST!');
    }

  } catch (err) {
    console.error('Debug Error:', err.message);
  } finally {
    await pool.end();
  }
}

debugColumns();
