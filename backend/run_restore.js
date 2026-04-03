const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { pool } = require('./src/config/database');

async function runRestoration() {
  const sqlPath = path.join(__dirname, 'restore_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Bắt đầu khôi phục Database schema...');

  try {
    await pool.query(sql);
    console.log('✅ Khôi phục Database thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi khôi phục Database:', error.message);
    process.exit(1);
  }
}

runRestoration();
