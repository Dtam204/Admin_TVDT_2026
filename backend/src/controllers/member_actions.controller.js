const { pool } = require('../config/database');
const { generateTransactionId } = require('../utils/id_helper');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * tags:
 *   name: MemberActions
 *   description: Nhật ký hoạt động, Giao dịch ví và Bảo mật hội viên
 */

/**
 * Xem lịch sử giao dịch toàn hệ thống (Hợp nhất từ payments)
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const { limit = 20, page = 1, search = '' } = req.query;
    const offset = (page - 1) * parseInt(limit);

    let query = `
      SELECT 
        p.*, 
        m.full_name as member_name, 
        m.card_number,
        p.type as transaction_type,
        p.notes as description
      FROM payments p
      LEFT JOIN members m ON p.member_id = m.id
      WHERE 1=1
    `;
    
    const params = [];
    if (search) {
      query += ` AND (m.full_name ILIKE $1 OR m.card_number ILIKE $1 OR p.notes ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*) FROM payments p
      LEFT JOIN members m ON p.member_id = m.id
      WHERE 1=1
    `;
    if (search) {
      countQuery += ` AND (m.full_name ILIKE $1 OR m.card_number ILIKE $1 OR p.notes ILIKE $1)`;
    }
    const countRes = await pool.query(countQuery, search ? [`%${search}%`] : []);
    const total = parseInt(countRes.rows[0].count);

    res.json({ 
      success: true, 
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a simple transaction (Standardized to payments table)
 */
exports.createTransaction = async (req, res) => {
  const client = await pool.connect();
  try {
    const { member_id, amount, transaction_type, description } = req.body;
    await client.query('BEGIN');

    const typeMap = {
      'deposit': 'wallet_deposit',
      'withdrawal': 'wallet_withdrawal',
      'fine': 'fee_penalty',
      'refund': 'refund',
      'payment': 'manual_payment',
      'fee': 'service_fee'
    };
    const mappedType = typeMap[transaction_type] || transaction_type;

    await client.query(
      `INSERT INTO payments (member_id, amount, type, status, notes, transaction_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [member_id, amount, mappedType, 'completed', description, generateTransactionId(mappedType)]
    );

    let balanceChange = parseFloat(amount);
    if (['wallet_withdrawal', 'fee_penalty', 'service_fee', 'manual_payment'].includes(mappedType)) {
      balanceChange = -Math.abs(balanceChange);
    } else {
      balanceChange = Math.abs(balanceChange);
    }

    await client.query(
      'UPDATE members SET balance = COALESCE(balance, 0) + $1 WHERE id = $2',
      [balanceChange, member_id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Giao dịch thành công và đã cập nhật số dư' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

/**
 * Admin Issues a Fine (Phiếu phí phạt)
 */
exports.createFine = async (req, res) => {
  try {
    const { member_id, amount, description } = req.body;
    
    if (!member_id || !amount) {
      return res.status(400).json({ success: false, message: 'Thiếu Member ID hoặc Số tiền phạt' });
    }

    const { rows } = await pool.query(
      `INSERT INTO payments (member_id, amount, type, status, notes, transaction_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING id`,
      [member_id, Math.abs(amount), 'fee_penalty', 'pending', description || 'Phí phạt vi phạm nội quy', generateTransactionId('PEN')]
    );

    await pool.query(
      'INSERT INTO member_activities (member_id, activity_type, description) VALUES ($1, $2, $3)',
      [member_id, 'fine_issued', `Hệ thống gửi phiếu phí phạt: ${amount.toLocaleString()} VNĐ. Truy vấn ID: #${rows[0].id}`]
    );

    res.json({ success: true, message: 'Đã gửi phiếu phí phạt cho hội viên (Trạng thái: Chờ đóng)', payment_id: rows[0].id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Issues a Refund
 */
exports.createRefund = async (req, res) => {
  const client = await pool.connect();
  try {
    const { member_id, amount, description } = req.body;
    await client.query('BEGIN');

    const refundAmount = Math.abs(amount);

    await client.query(
      `INSERT INTO payments (member_id, amount, type, status, notes, transaction_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [member_id, refundAmount, 'refund', 'completed', description || 'Hoàn tiền giao dịch', generateTransactionId('REF')]
    );

    await client.query(
      'UPDATE members SET balance = balance + $1 WHERE id = $2',
      [refundAmount, member_id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Đã hoàn tiền thành công vào ví' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

/**
 * Get Activities
 */
exports.getActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM member_activities WHERE member_id = $1 ORDER BY created_at DESC LIMIT 50', [id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Transactions (Consolidated from payments table)
 */
exports.getTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        id, amount, type as transaction_type, status, notes as description, created_at
      FROM payments 
      WHERE member_id = $1 
      ORDER BY created_at DESC
    `, [id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Manual Deposit
 */
exports.deposit = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { amount, description } = req.body;
    await client.query('BEGIN');
    
    await client.query(`
      INSERT INTO payments (member_id, amount, type, status, notes, transaction_id, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `, [id, amount, 'wallet_deposit', 'completed', description || 'Nạp tiền qua quầy', generateTransactionId('DEP')]);
    
    await client.query('UPDATE members SET balance = COALESCE(balance, 0) + $1 WHERE id = $2', [amount, id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'Nạp tiền thành công và đã cập nhật vào bảng thanh toán' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

/**
 * Reset Password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE members SET password = $1 WHERE id = $2', [hashedPassword, id]);
    res.json({ success: true, message: 'Đã reset mật khẩu' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.logActivity = async (memberId, type, description, ip = null, userAgent = null, externalClient = null) => {
  const queryRunner = externalClient || pool;
  try {
    await queryRunner.query('INSERT INTO member_activities (member_id, activity_type, description, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)', [memberId, type, description, ip, userAgent]);
  } catch (err) {
    console.error('Log Activity Error:', err);
  }
};
