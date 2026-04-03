const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { pool } = require('./src/config/database');

async function runFix() {
  const sqlPath = path.join(__dirname, 'fix_borrow_v2.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Đang sửa lỗi 400 Mượn sách (Constraint Fix)...');

  try {
    await pool.query(sql);
    console.log('✅ Đã sửa lỗi Database cho module Mượn sách!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi sửa Database:', error.message);
    process.exit(1);
  }
}

runFix();
