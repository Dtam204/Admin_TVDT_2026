/**
 * Force Reset Database Script
 * TERMINATE tất cả connections rồi DROP & CREATE database
 * 
 * WARNING: Xóa toàn bộ dữ liệu!
 */

require('dotenv').config();
const { Pool } = require('pg');

async function forceResetDatabase() {
  const dbName = process.env.DB_NAME || 'library_tn';
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres', // Connect to postgres to manage other DBs
  };

  console.log('⚠️  WARNING: This will FORCE DELETE all data in database:', dbName);
  console.log('🔥 Force resetting database...\n');

  const pool = new Pool(dbConfig);

  try {
    // Step 1: Terminate all connections to the database
    console.log('🔪 Step 1: Terminating all connections...');
    await pool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid()
    `, [dbName]);
    console.log('✅ All connections terminated\n');

    // Step 2: Drop database
    console.log(`🗑️  Step 2: Dropping database '${dbName}'...`);
    await pool.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log('✅ Dropped\n');

    // Step 3: Create database
    console.log(`📦 Step 3: Creating database '${dbName}'...`);
    await pool.query(`CREATE DATABASE ${dbName}`);
    console.log('✅ Created\n');

    console.log('✨ Database force reset complete!');
    console.log('\n💡 Next step:');
    console.log('   npm run setup\n');

  } catch (error) {
    console.error('❌ Force reset failed:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.detail) console.error('Detail:', error.detail);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

forceResetDatabase();
