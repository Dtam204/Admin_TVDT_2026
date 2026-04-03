/**
 * Migration Script for Phase 2
 * Chạy bản cập nhật dữ liệu Phase 2 mà không cần lệnh psql
 * 
 * Usage: node scripts/migrate-phase2.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const { Pool } = require('pg');

async function migrate() {
  console.log('🚀 Bắt đầu thực thi bản cập nhật Phase 2...\n');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'library_tn',
  };

  const pool = new Pool(dbConfig);
  let client;

  try {
    client = await pool.connect();
    console.log('✅ Đã kết nối tới Database: ' + dbConfig.database);

    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '20260403_phase2_synchronized.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Không tìm thấy file migration tại: ${migrationPath}`);
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Đang thực thi các câu lệnh SQL...');
    await client.query(sql);
    
    console.log('\n🎉 Chúc mừng! Bản cập nhật Phase 2 đã hoàn tất thành công.');
    console.log('   - Đã khởi tạo bảng: notifications, book_reviews, wishlists');
    console.log('   - Đã cập nhật quyền hệ thống: notifications.view, notifications.manage, book_loans.manage');
    console.log('   - Đã gán quyền cho Admin.\n');
    console.log('💡 Bây giờ bạn hãy quay lại trình duyệt và nhấn F5 để tận hưởng giao diện mới.');

  } catch (error) {
    console.error('\n❌ Lỗi khi thực thi migration:');
    console.error(`   ${error.message}`);
    if (error.detail) console.error(`   Chi tiết: ${error.detail}`);
    process.exit(1);
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
}

migrate();
