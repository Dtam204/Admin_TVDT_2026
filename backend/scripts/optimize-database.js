/**
 * Database Optimization Script
 * Runs performance optimizations on the database
 * Usage: npm run optimize-db
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'library_tn',
});

async function optimizeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database optimization...\n');
    console.log('ℹ️  Note: Performance indexes are already included in schema.sql\n');
    
    // Bước 1: Analyze tables
    console.log('📊 Step 1/2: Analyzing tables...');
    const tables = [
      'news', 'news_categories',
      'media_files', 'media_folders',
      'users', 'roles', 'permissions',
      'contact_requests', 'contact_sections', 'contact_section_items',
      'homepage_blocks', 'seo_pages', 'site_settings',
      'testimonials', 'menus',
      'books', 'authors', 'publishers', 'book_categories',
      'courses', 'course_categories', 'instructors',
      'members', 'membership_plans', 'book_loans', 'payments'
    ];
    
    for (const table of tables) {
      try {
        await client.query(`ANALYZE ${table}`);
        console.log(`  ✓ Analyzed ${table}`);
      } catch (err) {
        console.log(`  ⚠️  Skipped ${table} (${err.message})`);
      }
    }
    console.log('✅ Table analysis complete\n');
    
    // Bước 2: Refresh materialized views
    console.log('🔄 Step 2/2: Refreshing materialized views...');
    try {
      await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats');
      console.log('  ✓ Refreshed dashboard_stats');
    } catch (err) {
      console.log(`  ⚠️  Could not refresh dashboard_stats: ${err.message}`);
      console.log('  ℹ️  This is normal if the view doesn\'t exist yet');
    }
    console.log('✅ Materialized views refreshed\n');
    
    // Thống kê
    console.log('📈 Database Statistics:');
    const stats = await client.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);
    
    console.log('\n  Top 10 largest tables:');
    stats.rows.forEach(row => {
      console.log(`    ${row.tablename.padEnd(30)} ${row.size}`);
    });
    
    console.log('\n✅ Database optimization complete!\n');
    
  } catch (err) {
    console.error('\n❌ Optimization failed:');
    console.error(err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

optimizeDatabase();
