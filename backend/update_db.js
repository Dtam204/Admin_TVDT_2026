const { pool } = require('./src/config/database');

async function migrate() {
  console.log('🚀 Starting Database Migration...');
  try {
    await pool.query(`
      ALTER TABLE books 
      ADD COLUMN IF NOT EXISTS edition VARCHAR(255),
      ADD COLUMN IF NOT EXISTS volume VARCHAR(255),
      ADD COLUMN IF NOT EXISTS dimensions VARCHAR(255),
      ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS digital_content JSONB DEFAULT '{}';
    `);
    console.log('✅ Migration Successful: Columns added to books table.');
  } catch (error) {
    console.error('❌ Migration Failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
