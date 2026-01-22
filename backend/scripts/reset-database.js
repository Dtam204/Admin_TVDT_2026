/**
 * Reset Database Script
 * DROP và tạo lại database từ đầu
 * 
 * WARNING: Xóa toàn bộ dữ liệu!
 */

require('dotenv').config();
const { Pool } = require('pg');

async function resetDatabase() {
  const dbName = process.env.DB_NAME || 'library_tn';
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres', // Connect to postgres to drop/create other DBs
  };

  console.log('⚠️  WARNING: This will DELETE all data in database:', dbName);
  console.log('🔥 Resetting database...\n');

  const pool = new Pool(dbConfig);

  try {
    // Drop database
    console.log(`🗑️  Dropping database '${dbName}'...`);
    await pool.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log('✅ Dropped\n');

    // Create database
    console.log(`📦 Creating database '${dbName}'...`);
    await pool.query(`CREATE DATABASE ${dbName}`);
    console.log('✅ Created\n');

    console.log('✨ Database reset complete!');
    console.log('\n💡 Next step:');
    console.log('   node scripts/setup-simple.js\n');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    if (error.code) console.error('Code:', error.code);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
