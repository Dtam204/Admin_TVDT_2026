const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'thuvien_db',
  password: process.env.DB_PASSWORD || '123456',
  port: process.env.DB_PORT || 5432,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Database Migration v2...');

    // 1. Thêm cột toc (JSONB)
    await client.query(`
      ALTER TABLE books 
      ADD COLUMN IF NOT EXISTS toc JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('✅ Column "toc" added/verified.');

    // 2. Thêm cột access_policy
    await client.query(`
      ALTER TABLE books 
      ADD COLUMN IF NOT EXISTS access_policy VARCHAR(50) DEFAULT 'public';
    `);
    console.log('✅ Column "access_policy" added/verified.');

    console.log('🎉 Migration Success!');
  } catch (err) {
    console.error('❌ Migration Failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
