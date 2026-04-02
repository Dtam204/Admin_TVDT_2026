const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

const secret = jwtConfig.secret || process.env.JWT_SECRET || 'sfb-demo-secret';

/**
 * Middleware chính (mặc định) - Yêu cầu Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}

/**
 * Middleware tùy chọn - Không chặn nếu không có Token
 */
function authenticateTokenOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    // Token lỗi cũng không chặn, chỉ là không có req.user
    next();
  }
}

// Export mặc định là authenticateToken để tương thích với requireAuth = require(...)
module.exports = authenticateToken;

// Gán thêm các thuộc tính để dùng như named exports
module.exports.authenticateToken = authenticateToken;
module.exports.authenticateTokenOptional = authenticateTokenOptional;
module.exports.requireAuth = authenticateToken;
