/**
 * Simple Database Setup Script
 * Chỉ chạy schema.sql để setup toàn bộ database
 * 
 * Usage: node scripts/setup-simple.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { createDatabaseIfNotExists } = require('../src/config/database');

async function setupSimple() {
  console.log('🚀 Starting database setup...\n');

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
    console.log('📦 Step 1/3: Creating database...');
    const dbCreated = await createDatabaseIfNotExists();
    if (!dbCreated) {
      console.error('❌ Cannot create database. Check PostgreSQL connection.');
      process.exit(1);
    }
    console.log('✅ Database ready\n');

    // Step 2: Connect
    console.log('🔌 Step 2/3: Connecting to database...');
    pool = new Pool(dbConfig);
    client = await pool.connect();
    console.log('✅ Connected\n');

    // Step 3: Run schema.sql
    console.log('📄 Step 3/3: Running schema.sql...');
    console.log('   This includes:');
    console.log('   - Core system (roles, users, permissions)');
    console.log('   - News, Contact, Media, Menus, SEO');
    console.log('   - Phase 1: Books, Courses, Members, Payments');
    console.log('   - All seed data\n');
    
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSQL);
    console.log('✅ Schema executed successfully\n');

    // Verify
    console.log('✅ Verifying setup...');
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`   Found ${tables.length} table(s)\n`);
    
    // Count seed data
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM roles'),
      client.query('SELECT COUNT(*) FROM permissions'),
      client.query('SELECT COUNT(*) FROM membership_plans'),
      client.query('SELECT COUNT(*) FROM publishers'),
      client.query('SELECT COUNT(*) FROM authors'),
      client.query('SELECT COUNT(*) FROM book_categories'),
      client.query('SELECT COUNT(*) FROM books'),
      client.query('SELECT COUNT(*) FROM course_categories'),
      client.query('SELECT COUNT(*) FROM instructors'),
      client.query('SELECT COUNT(*) FROM courses'),
      client.query('SELECT COUNT(*) FROM members'),
    ]);

    console.log('📊 Seed Data Summary:');
    console.log(`   Roles: ${counts[0].rows[0].count}`);
    console.log(`   Permissions: ${counts[1].rows[0].count}`);
    console.log(`   Membership Plans: ${counts[2].rows[0].count}`);
    console.log(`   Publishers: ${counts[3].rows[0].count}`);
    console.log(`   Authors: ${counts[4].rows[0].count}`);
    console.log(`   Book Categories: ${counts[5].rows[0].count}`);
    console.log(`   Books: ${counts[6].rows[0].count}`);
    console.log(`   Course Categories: ${counts[7].rows[0].count}`);
    console.log(`   Instructors: ${counts[8].rows[0].count}`);
    console.log(`   Courses: ${counts[9].rows[0].count}`);
    console.log(`   Members: ${counts[10].rows[0].count}\n`);

    console.log('🎉 Database setup completed successfully!\n');
    console.log('💡 Next steps:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Start frontend: cd frontend && npm run dev');
    console.log('   3. Login: http://localhost:3000/admin/login\n');

  } catch (error) {
    console.error('\n❌ Setup failed:');
    console.error(`   Error: ${error.message}`);
    if (error.code) console.error(`   Code: ${error.code}`);
    if (error.detail) console.error(`   Detail: ${error.detail}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure PostgreSQL is running!');
    }
    
    process.exit(1);
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

setupSimple();
