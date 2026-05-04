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
 * Common formatting function for reader data to ensure snake_case
 */
const formatReaderResponse = (readerData, effective, age) => {
  const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : null;

  return {
    id: readerData.id,
    full_name: readerData.full_name,
    email: readerData.email,
    phone: readerData.phone,
    gender: readerData.gender,
    date_of_birth: formatDate(readerData.date_of_birth),
    identity_number: readerData.identity_number,
    address: readerData.address,
    avatar: readerData.avatar,
    card_number: readerData.card_number,
    balance: parseFloat(readerData.balance || 0),
    membership_expires: formatDate(readerData.membership_expires),
    status: readerData.status,
    plan_name: effective.plan_name,
    tier_code: effective.tier_code,
    max_borrow_limit: effective.max_books_borrowed,
    is_expired: effective.is_expired,
    current_loans_count: parseInt(readerData.current_loans_count || 0),
    total_fines: parseFloat(readerData.total_fines || 0),
    age: age
  };
};

/**
 * Calculate age helper
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Generate tokens helper
 */
const generateTokens = (readerData, effective) => {
  const accessToken = jwt.sign(
    {
      sub: readerData.id,
      user_id: readerData.user_id,
      email: readerData.email,
      card_number: readerData.card_number,
      role: readerData.role_code,
      tier_code: effective.tier_code,
      type: 'reader'
    },
    jwtConfig.secret,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    {
      sub: readerData.id,
      type: 'reader_refresh'
    },
    jwtConfig.secret,
    { expiresIn: '7d' }
  );

  const now = new Date();
  const access_token_expiry = new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
  const refresh_token_expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    access_token_expiry,
    refresh_token_expiry
  };
};

/**
 * Authenticate reader by email/card number and password
 */
async function authenticateReader({ identifier, password }) {
  if (!identifier || !password) return null;

  try {
    const { rows } = await pool.query(
      `
      SELECT 
        m.id, m.user_id, m.full_name, m.email, m.phone, m.card_number, 
        m.avatar, m.balance, m.status, m.membership_expires, 
        m.date_of_birth, m.identity_number,
        m.gender, m.address, m.created_at,
        u.password, u.role_id,
        r.code AS role_code,
        mp.name as plan_name, mp.max_books_borrowed, mp.tier_code,
        (SELECT COUNT(*) FROM book_loans WHERE member_id = m.id AND status IN ('borrowing', 'overdue')) as current_loans_count,
        (SELECT COALESCE(SUM(late_fee), 0) FROM book_loans WHERE member_id = m.id) as total_fines
      FROM members m
      JOIN users u ON m.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      WHERE (LOWER(m.email) = LOWER($1) OR LOWER(m.card_number) = LOWER($1))
      LIMIT 1
      `,
      [identifier.trim()]
    );

    if (rows.length === 0) return null;

    const readerData = rows[0];
    if (readerData.status !== 'active') return null;

    const isPasswordValid = await bcrypt.compare(password, readerData.password).catch(() => false);
    if (!isPasswordValid) return null;

    const effective = getEffectiveMembership({
      membership_expires: readerData.membership_expires,
      tier_code: readerData.tier_code || 'basic',
      plan_name: readerData.plan_name || 'Cơ bản',
      max_books_borrowed: readerData.max_books_borrowed || 3
    });

    const age = calculateAge(readerData.date_of_birth);
    const tokens = generateTokens(readerData, effective);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP + interval '7 days')`,
      [readerData.user_id, tokens.refresh_token]
    );

    return {
      ...tokens,
      reader: formatReaderResponse(readerData, effective, age)
    };
  } catch (error) {
    console.error('Reader authentication error:', error);
    return null;
  }
}

/**
 * Refresh Reader Token
 */
async function refreshReaderToken(token) {
  try {
    // 1. Verify JWT
    const decoded = jwt.verify(token, jwtConfig.secret);
    if (decoded.type !== 'reader_refresh') throw new Error('Mã làm mới không hợp lệ');

    // 2. Check Database for revoked token
    const { rows: tokenRows } = await pool.query(
      'SELECT user_id, revoked FROM refresh_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
      [token]
    );

    if (tokenRows.length === 0) throw new Error('Phiên đăng nhập đã hết hạn');
    if (tokenRows[0].revoked) throw new Error('Mã làm mới đã bị thu hồi');

    const userId = tokenRows[0].user_id;

    // 3. Fetch Full Reader Info
    const { rows: readerRows } = await pool.query(
      `
      SELECT 
        m.id, m.user_id, m.full_name, m.email, m.phone, m.card_number, 
        m.avatar, m.balance, m.status, m.membership_expires, 
        m.date_of_birth, m.identity_number,
        m.gender, m.address, m.created_at,
        r.code AS role_code,
        mp.name as plan_name, mp.max_books_borrowed, mp.tier_code,
        (SELECT COUNT(*) FROM book_loans WHERE member_id = m.id AND status IN ('borrowing', 'overdue')) as current_loans_count,
        (SELECT COALESCE(SUM(late_fee), 0) FROM book_loans WHERE member_id = m.id) as total_fines
      FROM members m
      JOIN users u ON m.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      WHERE m.user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    if (readerRows.length === 0) throw new Error('Không tìm thấy tài khoản bạn đọc');
    const readerData = readerRows[0];

    const effective = getEffectiveMembership({
      membership_expires: readerData.membership_expires,
      tier_code: readerData.tier_code || 'basic',
      plan_name: readerData.plan_name || 'Cơ bản',
      max_books_borrowed: readerData.max_books_borrowed || 3
    });

    const age = calculateAge(readerData.date_of_birth);
    const tokens = generateTokens(readerData, effective);

    // 4. Token Rotation: Revoke old token and insert new one
    await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1', [token]);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP + interval '7 days')`,
      [userId, tokens.refresh_token]
    );

    return {
      ...tokens,
      reader: formatReaderResponse(readerData, effective, age)
    };
  } catch (error) {
    throw error;
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
  refreshReaderToken,
  revokeRefreshToken,
  logoutAllDevices
};
