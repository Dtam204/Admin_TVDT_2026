const { pool } = require('./src/config/database');

async function runIndexes() {
  const client = await pool.connect();
  try {
    console.log('--- Bắt đầu thêm Index tối ưu hóa ---');
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_code ON books(code);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_slug ON books(slug);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_copies_barcode ON publication_copies(barcode);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);');
    console.log('✅ Đã thêm tất cả các Index quan trọng.');
  } catch (err) {
    console.error('❌ Lỗi khi thêm Index:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

runIndexes();
