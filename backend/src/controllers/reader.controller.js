const { authenticateReader } = require('../services/reader/auth.service');
const { pool } = require('../config/database');

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
      SELECT m.id, m.full_name as fullName, m.email, m.phone, m.card_number as cardNumber, 
             m.registration_date as registrationDate, m.expiration_date as expirationDate, 
             m.status, 
             (SELECT COUNT(*) FROM book_loans WHERE member_id = m.id AND status = 'borrowing') as currentLoansCount,
             (SELECT COALESCE(SUM(late_fee), 0) FROM book_loans WHERE member_id = m.id) as totalFines
      FROM members m WHERE m.id = $1
    `, [readerId]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng", code: 404 });

    const profile = rows[0];
    profile.isExpired = new Date(profile.expirationdate) < new Date();

    res.json({ success: true, data: profile, code: 0 });
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

// Gia hạn thẻ
exports.renewCard = async (req, res) => {
  try {
    const readerId = req.user.id;
    const { paymentMethod } = req.body; // mock
    
    // Gia hạn thêm 1 năm (365 ngày)
    const { rows } = await pool.query(`
      UPDATE members 
      SET expiration_date = COALESCE(expiration_date, CURRENT_TIMESTAMP) + INTERVAL '1 year', status = 'active'
      WHERE id = $1 RETURNING expiration_date as expirationDate
    `, [readerId]);

    res.json({ success: true, message: "Gia hạn thẻ thành công", data: rows[0], code: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, code: 500 });
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
