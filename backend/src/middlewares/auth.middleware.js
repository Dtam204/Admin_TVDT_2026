const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

const secret = jwtConfig.secret || process.env.JWT_SECRET || 'sfb-demo-secret';

/**
 * Middleware chính (mặc định) - Yêu cầu Token
 * CHUẨN HÓA RESTFUL CHUYÊN NGHIỆP: Trả về đầy đủ message và code
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Truy cập bị từ chối. Vui lòng cung cấp mã xác thực (Token).', 
      code: 401 
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Mã xác thực (Token) không hợp lệ hoặc đã hết hạn.', 
      code: 401 
    });
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
    // Token lỗi cũng không chặn, chỉ là không gán req.user
    next();
  }
}

// Export mặc định và gán các thuộc tính named exports
module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.authenticateTokenOptional = authenticateTokenOptional;
module.exports.requireAuth = authenticateToken;
