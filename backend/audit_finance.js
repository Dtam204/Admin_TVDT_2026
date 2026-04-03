require('dotenv').config();
const { Pool } = require('pg');

async function auditFinance() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  });

  try {
    const tables = ['payments', 'membership_requests'];
    console.log('--- FINANCE & SEPAY AUDIT ---');
    
    for (const table of tables) {
      const { rows } = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      console.log(`\nTable: ${table}`);
      console.log('Columns:', rows.map(r => r.column_name).join(', '));
    }
  } catch (err) {
    console.error('Audit Error:', err.message);
  } finally {
    await pool.end();
  }
}

auditFinance();
