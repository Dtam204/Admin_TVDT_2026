const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

// Bearer JWT auth middleware for admin APIs
// Expect header: Authorization: Bearer <token>
module.exports = function requireAuth(req, res, next) {
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
    // Attach user info to request
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid or expired token',
    });
  }
};

