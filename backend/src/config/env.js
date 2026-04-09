require('dotenv').config();

const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'sfb-demo-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_tn',
};

module.exports = {
  port: PORT,
  db: DB_CONFIG,
  jwt: {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRES_IN,
  },
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT || 587,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || '"Thư viện TN" <noreply@gmail.com>',
  },
};


