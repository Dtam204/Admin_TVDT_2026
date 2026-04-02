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
    console.log('🚀 Starting Publisher DB Migration...');

    // 1. Kiểm tra kiểu dữ liệu của cột name
    const typeRes = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'publishers' AND column_name = 'name';
    `);
    
    if (typeRes.rows.length > 0 && typeRes.rows[0].data_type !== 'jsonb') {
      console.log('🔄 Converting "name" to JSONB...');
      await client.query(`
        ALTER TABLE publishers 
        ALTER COLUMN name TYPE jsonb USING jsonb_build_object('vi', name::text);
      `);
      console.log('✅ Column "name" converted to JSONB.');
    } else {
      console.log('ℹ️ Column "name" is already JSONB or not found.');
    }

    // 2. Thêm các cột mới
    await client.query(`
      ALTER TABLE publishers 
      ADD COLUMN IF NOT EXISTS description JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS email VARCHAR(100),
      ADD COLUMN IF NOT EXISTS website VARCHAR(255),
      ADD COLUMN IF NOT EXISTS logo_url TEXT,
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
    `);
    console.log('✅ New columns added/verified.');

    console.log('🎉 Publisher Migration Success!');
  } catch (err) {
    console.error('❌ Migration Failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
