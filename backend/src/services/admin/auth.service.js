const { pool } = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../../config/env');

/**
 * Admin Authentication Service
 * Handles authentication for admin users only
 */

/**
 * Authenticate admin user by email and password
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object|null>} - { token, user, expiresIn } or null if invalid
 */
async function authenticateAdmin({ email, password }) {
  if (!email || !password) {
    return null;
  }

  try {
    // Find user by email with role information
    const { rows } = await pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.name,
        u.password,
        u.status,
        u.role_id,
        r.code AS role_code,
        r.name AS role_name,
        r.is_active AS role_is_active
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
      LIMIT 1
    `,
      [email.toLowerCase().trim()],
    );

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];

    // Only allow active users with active roles
    if (user.status !== 'active' || !user.role_is_active) {
      return null;
    }

    // Compare password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password).catch(() => false);

    if (!isPasswordValid) {
      return null;
    }

    // Get permissions for the role
    const { rows: permRows } = await pool.query(
      `
      SELECT p.code
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = $1
        AND p.is_active = TRUE
    `,
      [user.role_id],
    );

    const permissions = permRows.map((p) => p.code);

    // Sign JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role_code,
        permissions,
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.role_id,
        roleCode: user.role_code,
        roleName: user.role_name,
        status: user.status,
        permissions,
      },
      expiresIn: jwtConfig.expiresIn,
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return null;
  }
}

/**
 * Verify JWT token and get user info
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} - Decoded token payload or null if invalid
 */
async function verifyAdminToken(token) {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Optionally verify user still exists and is active
    const { rows } = await pool.query(
      `
      SELECT u.id, u.status, r.is_active AS role_is_active
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
      LIMIT 1
    `,
      [decoded.sub],
    );

    if (rows.length === 0 || rows[0].status !== 'active' || !rows[0].role_is_active) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

module.exports = {
  authenticateAdmin,
  verifyAdminToken,
};

