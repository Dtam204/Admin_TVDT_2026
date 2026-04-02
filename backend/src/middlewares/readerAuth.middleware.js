const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

/**
 * Middleware to verify Reader (Member) JWT token
 * Expects header: Authorization: Bearer <token>
 */
module.exports = function requireReaderAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: missing bearer token',
      });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Verify if this is a reader (member) token
    // Usually Reader tokens have member_id instead of user_id
    if (!decoded.member_id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Reader access required',
      });
    }

    req.member = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid or expired token',
    });
  }
};
