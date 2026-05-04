/**
 * Database Synchronizer Script
 * Chạy schema.sql để khởi tạo hoặc đồng bộ hóa database.
 * An toàn để chạy lại nhiều lần (Idempotent).
 * 
 * Usage: npm run setup
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { createDatabaseIfNotExists } = require('../src/config/database');
const { seedSampleData } = require('./seed-sample-data');

async function setupSimple() {
  console.log('🚀 Starting database synchronization...\n');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'library_tn',
  };

  console.log('📋 Configuration:');
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}\n`);

  let pool;
  let client;

  try {
    // Step 1: Create database
    console.log('📦 Step 1/3: Preparing database...');
    const dbCreated = await createDatabaseIfNotExists();
    if (!dbCreated) {
      console.error('❌ Cannot prepare database. Check PostgreSQL connection.');
      process.exit(1);
    }
    console.log('✅ Database is ready\n');

    // Step 2: Connect
    console.log('🔌 Step 2/3: Connecting to database...');
    pool = new Pool(dbConfig);
    client = await pool.connect();
    console.log('✅ Connected successfully\n');

    // Step 3: Run schema.sql
    console.log('📄 Step 3/3: Synchronizing schema.sql...');
    console.log('   Syncing modules:');
    console.log('   - Core System & RBAC');
    console.log('   - CMS (News, Media, SEO)');
    console.log('   - Library Phase 1 (Books, Loans, Payments)');
    console.log('   - Library Phase 2 (Notifications, Reviews, Wishlists)');
    console.log('   - Interaction Workflow (Requests, Comments)\n');
    
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into semi-colon separated statements for better error handling if needed
    // But for a simple sync, running the whole file is OK as it uses IF NOT EXISTS
    await client.query(schemaSQL);
    console.log('✅ Schema synchronization completed\n');

    // Seed additional cross-flow sample data (admin/app/reader/webhook)
    console.log('🌱 Seeding supplemental sample data...');
    await seedSampleData();
    console.log('✅ Supplemental sample data completed\n');

    // Verify
    console.log('🔍 Verifying system integrity...');
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`   ✅ Total tables synced: ${tables.length}\n`);
    
    // Count summary data
    const tableCounts = [
      { name: 'Roles', table: 'roles' },
      { name: 'Permissions', table: 'permissions' },
      { name: 'Users', table: 'users' },
      { name: 'Membership Plans', table: 'membership_plans' },
      { name: 'Members', table: 'members' },
      { name: 'Books', table: 'books' },
      { name: 'Book Loans', table: 'book_loans' },
      { name: 'Payments', table: 'payments' },
      { name: 'Notifications', table: 'notifications' },
      { name: 'Book Reviews', table: 'book_reviews' },
      { name: 'Comments', table: 'comments' },
      { name: 'Membership Requests', table: 'membership_requests' }
    ];

    console.log('📊 Synchronized Data Summary:');
    for (const item of tableCounts) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM ${item.table}`);
        console.log(`   - ${item.name.padEnd(20)}: ${res.rows[0].count}`);
      } catch (e) {
        console.log(`   - ${item.name.padEnd(20)}: (table not found or error)`);
      }
    }

    console.log('\n🎉 Database is now fully synchronized and up to date!\n');
    console.log('💡 Tip: You can run this command again safely whenever the schema.sql is updated.\n');

  } catch (error) {
    console.error('\n❌ Synchronization failed:');
    console.error(`   Error: ${error.message}`);
    if (error.code) console.error(`   Code: ${error.code}`);
    if (error.detail) console.error(`   Detail: ${error.detail}`);
    
    process.exit(1);
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

setupSimple();
