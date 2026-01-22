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

module.exports = {
  pool,
  dbConfig,
  testConnection,
  createDatabaseIfNotExists,
};
