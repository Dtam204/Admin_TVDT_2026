require('dotenv').config();
const { Pool } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_tn',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Tạo connection pool
const pool = new Pool(dbConfig);

// Xử lý lỗi pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Hàm test connection
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Hàm tạo database nếu chưa tồn tại (dùng cho setup)
async function createDatabaseIfNotExists() {
  // Kết nối đến postgres database để tạo database mới
  const adminConfig = {
    ...dbConfig,
    database: 'postgres', // Kết nối đến database mặc định
  };
  
  const adminPool = new Pool(adminConfig);
  
  try {
    // Kiểm tra xem database đã tồn tại chưa
    const checkDb = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbConfig.database]
    );
    
    if (checkDb.rows.length === 0) {
      // Tạo database mới
      await adminPool.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`✅ Database '${dbConfig.database}' created successfully`);
    } else {
      console.log(`✅ Database '${dbConfig.database}' already exists`);
    }
    
    await adminPool.end();
    return true;
  } catch (error) {
    const errorMsg = error.message || error.toString();
    console.error('❌ Failed to create database:', errorMsg);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Hint: PostgreSQL server might not be running.');
      console.error(`   Trying to connect to: ${adminConfig.host}:${adminConfig.port}`);
      console.error('   Please start PostgreSQL service or check your DB_HOST and DB_PORT in .env file.');
    } else if (error.code === '28P01') {
      console.error('💡 Hint: Authentication failed. Check your DB_USER and DB_PASSWORD in .env file.');
    }
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    await adminPool.end();
    return false;
  }
}

async function ensureCommentTables() {
  try {
    // Tạo bảng comments nếu chưa tồn tại (không đụng schema đã có)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        object_id INTEGER NOT NULL,
        object_type VARCHAR(50) NOT NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        reply_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        rating INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden', 'deleted')),
        is_featured BOOLEAN DEFAULT FALSE,
        likes_count INTEGER DEFAULT 0,
        dislikes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_comments_object ON comments(object_type, object_id);
      CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
    `);

    // Bổ sung cột thiếu nếu DB runtime cũ hơn schema hiện tại
    await pool.query(`
      ALTER TABLE comments
        ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
    `);

    // comment_reports chỉ thêm những cột chắc chắn có trong schema chuẩn
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comment_reports (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        report_type SMALLINT DEFAULT 4 CHECK (report_type IN (1, 2, 3, 4)),
        status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'processing', 'resolved', 'ignored')),
        resolved_by INTEGER REFERENCES users(id),
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON comment_reports(comment_id);
      CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status);
    `);

    // Nếu cột description tồn tại ở DB cũ thì giữ nguyên, không tạo mới để tránh xung đột
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comment_reactions (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reaction_type SMALLINT NOT NULL CHECK (reaction_type IN (0, 1, 2)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
      CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON comment_reactions(user_id);
    `);

    console.log('✅ Comment tables initialization checked');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize comment tables:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  dbConfig,
  testConnection,
  createDatabaseIfNotExists,
  ensureCommentTables,
};
