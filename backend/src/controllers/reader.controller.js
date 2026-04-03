const { authenticateReader } = require('../services/reader/auth.service');
const { pool } = require('../config/database');
const { getEffectiveMembership } = require('../utils/member_helper');

/**
 * Reader Controller
 * Handles requests for portal readers (members) 
 */

// Đăng nhập
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng nhập', code: 400 });

    const result = await authenticateReader({ identifier, password });
    if (result) return res.json({ success: true, ...result, code: 0 });

    return res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập hoặc tài khoản bị khoá', code: 401 });
  } catch (error) {
    console.error('Reader login error:', error);
    return res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};

// Lấy thông tin cá nhân (Profile 360)
exports.getProfile = async (req, res) => {
  try {
    const readerId = req.user.id; // Lấy từ middleware verifyToken
    const { rows } = await pool.query(`
      SELECT 
        m.id, m.full_name as fullName, m.email, m.phone, m.card_number as cardNumber, 
        m.membership_expires, m.status, m.balance,
        mp.name->>'vi' as planName, mp.tier_code, mp.max_books_borrowed,
        (SELECT COUNT(*) FROM book_loans WHERE member_id = m.id AND status IN ('borrowing', 'overdue')) as currentLoansCount,
        (SELECT COALESCE(SUM(late_fee), 0) FROM book_loans WHERE member_id = m.id) as totalFines
      FROM members m 
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      WHERE m.id = $1
    `, [readerId]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng", code: 404 });

    const member = rows[0];
    
    // 1. Tính toán quyền lợi thực tế (Đồng bộ logic Expiry)
    const effective = getEffectiveMembership({
      membership_expires: member.membership_expires,
      tier_code: member.tier_code || 'basic',
      plan_name: member.planName || 'Cơ bản',
      max_books_borrowed: member.max_books_borrowed || 3
    });

    res.json({ 
      success: true, 
      data: {
        ...member,
        planName: effective.plan_name,
        tierCode: effective.tier_code,
        maxBorrowLimit: effective.max_books_borrowed,
        isExpired: effective.is_expired
      }, 
      code: 0 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};

// Lấy lịch sử mượn trả
exports.getBorrowHistory = async (req, res) => {
  try {
    const readerId = req.user.id;
    const { type } = req.query; // 'digital' hoặc 'physical'

    let query = `
      SELECT bl.id as loanId, bl.loan_date as borrowDate, bl.return_date as returnDate, 
             bl.due_date as dueDate, bl.status, bl.late_fee as lateFee,
             b.title->>'vi' as title, b.author, b.is_digital as isDigital, b.cover_image as thumbnail,
             c.barcode
      FROM book_loans bl
      JOIN books b ON bl.book_id = b.id
      LEFT JOIN publication_copies c ON bl.copy_id = c.id
      WHERE bl.member_id = $1
    `;
    const params = [readerId];

    if (type === 'digital') {
      query += ` AND b.is_digital = true`;
    } else if (type === 'physical') {
      query += ` AND b.is_digital = false`;
    }

    query += ` ORDER BY bl.loan_date DESC`;
    const { rows } = await pool.query(query, params);

    res.json({ success: true, data: rows, code: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};

// Lịch sử giao dịch ví & thanh toán SePay
exports.getTransactions = async (req, res) => {
  try {
    const readerId = req.user.id;
    const { rows } = await pool.query(`
      SELECT id, amount, type, status, notes as description, transaction_id as txnId, created_at as createdAt
      FROM payments
      WHERE member_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [readerId]);

    res.json({ success: true, data: rows, code: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};

// Theo dõi yêu cầu nâng cấp/gia hạn thẻ
exports.getMembershipRequests = async (req, res) => {
  try {
    const readerId = req.user.id;
    const { rows } = await pool.query(`
      SELECT 
        mr.id, mr.status, mr.amount, mr.request_note as note, 
        mr.created_at as createdAt, mr.external_txn_id as txnId,
        mp.name->>'vi' as planName
      FROM membership_requests mr
      JOIN membership_plans mp ON mr.plan_id = mp.id
      WHERE mr.member_id = $1
      ORDER BY mr.created_at DESC
    `, [readerId]);

    res.json({ success: true, data: rows, code: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};

// Gia hạn thẻ (Tạo yêu cầu gia hạn trực tuyến)
exports.renewCard = async (req, res) => {
  const client = await pool.connect();
  try {
    const readerId = req.user.id;
    const { planId, requestNote } = req.body;
    
    if (!planId) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn gói hội viên", code: 400 });
    }

    await client.query('BEGIN');

    // 1. Lấy thông tin giá gói hiện tại để chốt đơn (Tuân thủ số tiền của gói)
    const { rows: plans } = await client.query(
      'SELECT id, price, name->> \'vi\' as planName FROM membership_plans WHERE id = $1 AND status = \'active\'',
      [planId]
    );

    if (plans.length === 0) {
      throw new Error("Gói hội viên không tồn tại hoặc đã ngừng cung cấp");
    }

    const plan = plans[0];

    // 2. Tạo yêu cầu gia hạn mới
    const { rows: requests } = await client.query(`
      INSERT INTO membership_requests (
        member_id, plan_id, status, amount, request_note, created_at
      ) VALUES ($1, $2, 'pending', $3, $4, CURRENT_TIMESTAMP)
      RETURNING id
    `, [readerId, planId, plan.price, requestNote || `Đăng ký gói ${plan.planName}`]);

    const requestId = requests[0].id;

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: "Yêu cầu gia hạn đã được gửi. Vui lòng thanh toán để kích hoạt.", 
      data: {
        requestId,
        amount: plan.price,
        planName: plan.planName,
        paymentContent: `TVDT ${requestId}` // Hướng dẫn nội dung cho SePay
      }, 
      code: 0 
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message, code: 500 });
  } finally {
    client.release();
  }
};

// Cập nhật thông tin profile
exports.updateProfile = async (req, res) => {
  try {
    const readerId = req.user.id;
    const { fullName, phone } = req.body;

    const { rows } = await pool.query(`
      UPDATE members SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone)
      WHERE id = $3 RETURNING id, full_name as fullName, phone
    `, [fullName, phone, readerId]);

    res.json({ success: true, message: "Cập nhật thành công", data: rows[0], code: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};

// Quên mật khẩu
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // Mock gửi email: trong thực tế sẽ tạo token lưu vào DB
    res.json({ success: true, message: "Đã gửi mã xác minh đến email của bạn", code: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
  }
};
