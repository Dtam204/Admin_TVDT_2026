const { pool } = require('../src/config/database');

async function migrate() {
  console.log('--- Database Migration: Ratings System ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('1. Allowing NULL user_id in comments table...');
    await client.query('ALTER TABLE comments ALTER COLUMN user_id DROP NOT NULL');
    
    console.log('2. Adding rating column to comments table...');
    await client.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS rating SMALLINT DEFAULT 0');
    
    console.log('3. Adding guest_name column to comments table...');
    await client.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255)');
    
    console.log('4. Adding rating check constraint...');
    // Drop existing if any to avoid error
    await client.query('ALTER TABLE comments DROP CONSTRAINT IF EXISTS rating_check');
    await client.query('ALTER TABLE comments ADD CONSTRAINT rating_check CHECK (rating >= 0 AND rating <= 5)');
    
    await client.query('COMMIT');
    console.log('--- Migration Finished Successfully ---');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('--- Migration Failed ---');
    console.error(error);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();
