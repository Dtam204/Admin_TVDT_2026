const { pool } = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../../config/env');
const { getEffectiveMembership } = require('../../utils/member_helper');

/**
 * Reader Authentication Service
 * Handles authentication for portal readers (members)
 */

/**
 * Authenticate reader by email/card number and password
 * @param {Object} credentials - { identifier, password }
 * @returns {Promise<Object|null>} - { token, reader, expiresIn }
 */
async function authenticateReader({ identifier, password }) {
  if (!identifier || !password) {
    return null;
  }

  try {
    // 1. Find reader by email OR card_number
    // SQL simplified: Get raw values, logic handled by JS helper
    const { rows } = await pool.query(
      `
      SELECT 
        m.id,
        m.email,
        m.full_name,
        m.card_number,
        m.status,
        m.membership_expires,
        u.password,
        u.role_id,
        r.code AS role_code,
        mp.name as plan_name,
        mp.max_books_borrowed,
        mp.tier_code
      FROM members m
      JOIN users u ON m.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      WHERE (LOWER(m.email) = LOWER($1) OR LOWER(m.card_number) = LOWER($1))
      LIMIT 1
      `,
      [identifier.trim()]
    );

    if (rows.length === 0) {
      return null;
    }

    const readerData = rows[0];

    // 2. Security check: Only allow active readers
    if (readerData.status !== 'active') {
      return null;
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, readerData.password).catch(() => false);
    if (!isPasswordValid) {
      return null;
    }

    // 4. Calculate Effective Membership (Business Logic)
    const effective = getEffectiveMembership({
      membership_expires: readerData.membership_expires,
      tier_code: readerData.tier_code || 'basic',
      plan_name: readerData.plan_name || 'Cơ bản',
      max_books_borrowed: readerData.max_books_borrowed || 3
    });

    // 5. Get Reader Entitlements (Placeholder for future)
    const entitlements = [];

    // 6. Generate JWT Tokens for Reader
    // AccessToken (Short-lived)
    const accessToken = jwt.sign(
      {
        sub: readerData.id,
        email: readerData.email,
        cardNumber: readerData.card_number,
        role: readerData.role_code,
        tierCode: effective.tier_code,
        type: 'reader'
      },
      jwtConfig.secret,
      { expiresIn: '1h' } 
    );

    // RefreshToken (Long-lived)
    const refreshToken = jwt.sign(
      {
        sub: readerData.id,
        type: 'reader_refresh'
      },
      jwtConfig.secret,
      { expiresIn: '7d' } 
    );

    // [SESSION MANAGEMENT] Lưu Refresh Token vào Database
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP + interval '7 days')`,
      [readerData.user_id, refreshToken]
    );

    return {
      accessToken,
      refreshToken,
      reader: {
        id: readerData.id,
        fullName: readerData.full_name,
        email: readerData.email,
        cardNumber: readerData.card_number,
        plan: effective.plan_name,
        tierCode: effective.tier_code,
        maxBorrowLimit: effective.max_books_borrowed,
        entitlements,
        status: readerData.status,
        isExpired: effective.is_expired
      },
      expiresIn: 3600 // 1 hour in seconds
    };

  } catch (error) {
    console.error('Reader authentication error:', error);
    return null;
  }
}

/**
 * Thu hồi Refresh Token (Đăng xuất cụ thể 1 thiết bị)
 */
async function revokeRefreshToken(token) {
  await pool.query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1',
    [token]
  );
  return true;
}

/**
 * Đăng xuất toàn bộ thiết bị (Xóa hết token của User)
 */
async function logoutAllDevices(userId) {
  await pool.query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
    [userId]
  );
  return true;
}

module.exports = {
  authenticateReader,
  revokeRefreshToken,
  logoutAllDevices
};
