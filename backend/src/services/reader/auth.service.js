const { pool } = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../../config/env');

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
    const { rows } = await pool.query(
      `
      SELECT 
        m.id,
        m.email,
        m.full_name,
        m.card_number,
        m.status,
        u.password,
        u.role_id,
        r.code AS role_code,
        m.membership_expires,
        CASE 
          WHEN m.membership_expires IS NOT NULL AND m.membership_expires < CURRENT_DATE THEN 'Thẻ Basic (Gói cũ đã hết hạn)'
          ELSE mp.name 
        END AS plan_name,
        CASE 
          WHEN m.membership_expires IS NOT NULL AND m.membership_expires < CURRENT_DATE THEN 3
          ELSE mp.max_books_borrowed 
        END AS max_borrow_limit,
        CASE 
          WHEN m.membership_expires IS NOT NULL AND m.membership_expires < CURRENT_DATE THEN 'basic'
          ELSE mp.tier_code 
        END AS tier_code
      FROM members m
      JOIN users u ON m.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      WHERE (m.email = $1 OR m.card_number = $1)
      LIMIT 1
      `,
      [identifier.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return null;
    }

    const reader = rows[0];

    // 2. Security check: Only allow active readers
    if (reader.status !== 'active') {
      return null;
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, reader.password).catch(() => false);
    if (!isPasswordValid) {
      return null;
    }

    // 4. Get Reader Entitlements (Extra permissions)
    const { rows: entitlementRows } = await pool.query(
      `
      SELECT resource_type, resource_id, extra_borrow_limit
      FROM reader_entitlements
      WHERE reader_id = $1 AND (expire_date IS NULL OR expire_date >= CURRENT_DATE) AND is_active = TRUE
      `,
      [reader.id]
    );

    const entitlements = entitlementRows.map(e => ({
      type: e.resource_type,
      id: e.resource_id,
      extraLimit: e.extra_borrow_limit
    }));

    // 5. Generate JWT Token for Reader
    // Nếu hết hạn -> Tier Code bị đè xuống 'basic' nhờ lệnh SQL ở trên.
    const token = jwt.sign(
      {
        sub: reader.id,
        email: reader.email,
        cardNumber: reader.card_number,
        role: reader.role_code,
        tierCode: reader.tier_code || 'basic',
        type: 'reader'
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return {
      token,
      reader: {
        id: reader.id,
        fullName: reader.full_name,
        email: reader.email,
        cardNumber: reader.card_number,
        plan: reader.plan_name,
        tierCode: reader.tier_code || 'basic',
        maxBorrowLimit: reader.max_borrow_limit || 3,
        entitlements,
        status: reader.status,
        isExpired: reader.membership_expires ? (new Date(reader.membership_expires) < new Date()) : false
      },
      expiresIn: jwtConfig.expiresIn
    };

  } catch (error) {
    console.error('Reader authentication error:', error);
    return null;
  }
}

module.exports = {
  authenticateReader
};
