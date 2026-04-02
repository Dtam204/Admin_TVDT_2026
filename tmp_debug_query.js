const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_tn',
});

async function runRawQuery() {
  try {
    console.log('--- RUNNING RAW QUERY (MATCHING SERVICE LOGIC) ---');
    const query = `SELECT 
                   b.id, 
                   b.title, 
                   b.isbn, 
                   b.author, 
                   b.code,
                   b.status,
                   b.is_digital,
                   b.created_at
                 FROM books b WHERE 1=1 ORDER BY b.created_at DESC`;
    
    const { rows } = await pool.query(query);
    console.log('Total books in DB:', rows.length);
    console.log('Items:', JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runRawQuery();
