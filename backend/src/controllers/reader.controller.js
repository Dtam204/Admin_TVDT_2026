const readerAuthService = require('../services/reader/auth.service');
const readerService = require('../services/reader/reader.service');
const { pool } = require('../config/database');

/**
 * Reader Controller - CHUẨN HÓA RESTFUL CHUYÊN NGHIỆP
 * Đảm bảo: Response đồng nhất, mã trạng thái chuẩn, thông điệp lịch sự.
 */

// 1. Đăng nhập (Thẻ hoặc Email)
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp đầy đủ mã thẻ/email và mật khẩu', 
        code: 400 
      });
    }

    const result = await readerAuthService.authenticateReader({ identifier, password });
    if (!result) {
      return res.status(401).json({ 
        success: false, 
        message: 'Thông tin tài khoản hoặc mật khẩu không chính xác', 
        code: 401 
      });
    }

    return res.json({ 
      success: true, 
      message: 'Đăng nhập thành công', 
      data: result, 
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};

// 2. Lấy thông tin cá nhân (Profile 360)
exports.getProfile = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const profile = await readerService.getProfile(readerId);
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: "Tài khoản không tồn tại trên hệ thống", 
        code: 404 
      });
    }

    return res.json({ 
      success: true, 
      message: "Lấy thông tin hồ sơ thành công",
      data: profile, 
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};

// 3. Cập nhật thông tin cá nhân
exports.updateProfile = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const { fullName, phone, email, gender, birthday, address } = req.body;

    const data = await readerService.updateProfile(readerId, { 
      fullName, phone, email, gender, birthday, address 
    });

    return res.json({ 
      success: true, 
      message: "Hồ sơ của bạn đã được cập nhật thành công", 
      data, 
      code: 0 
    });
  } catch (error) {
    const status = error.message.includes('đã được sử dụng') || error.message.includes('định dạng') ? 400 : 500;
    return res.status(status).json({ 
      success: false, 
      message: error.message, 
      code: status 
    });
  }
};

// 4. Đăng xuất (Thu hồi Refresh Token)
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: "Yêu cầu không hợp lệ. Vui lòng cung cấp mã xác thực.", 
        code: 400 
      });
    }

    await readerAuthService.revokeRefreshToken(refreshToken);
    return res.json({ 
      success: true, 
      message: "Đăng xuất thành công", 
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};

// 4.1. Đăng xuất khỏi tất cả thiết bị
exports.logoutAllDevices = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    
    const { rows: member } = await pool.query('SELECT user_id FROM members WHERE id = $1', [readerId]);
    if (member.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy thông tin định danh bạn đọc", 
        code: 404 
      });
    }

    await readerAuthService.logoutAllDevices(member[0].user_id);
    return res.json({ 
      success: true, 
      message: "Bạn đã đăng xuất khỏi tất cả các thiết bị thành công", 
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};

// 5. Luồng Quên mật khẩu & OTP
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await readerService.generateOTP(email);
    return res.json({ 
      success: true, 
      message: "Mã OTP xác thực đã được gửi đến email của bạn", 
      data: result, 
      code: 0 
    });
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      message: error.message, 
      code: 400 
    });
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    await readerService.verifyOTP(email, otpCode);
    return res.json({ 
      success: true, 
      message: "Xác thực mã OTP thành công", 
      code: 0 
    });
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      message: error.message, 
      code: 400 
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Mật khẩu xác nhận không khớp", 
        code: 400 
      });
    }
    await readerService.resetPassword(email, newPassword);
    return res.json({ 
      success: true, 
      message: "Đặt lại mật khẩu thành công. Vui lòng sử dụng mật khẩu mới để đăng nhập.", 
      code: 0 
    });
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      message: error.message, 
      code: 400 
    });
  }
};

// 6. Đổi mật khẩu ngay trong App
exports.changePassword = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Mật khẩu mới và mật khẩu xác nhận không trùng khớp", 
        code: 400 
      });
    }

    await readerService.changePassword(readerId, oldPassword, newPassword);
    return res.json({ 
      success: true, 
      message: "Mật khẩu của bạn đã được thay đổi thành công", 
      code: 0 
    });
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      message: error.message, 
      code: 400 
    });
  }
};

// 7. Lịch sử Mượn trả (Physical Loans)
exports.getBorrowHistory = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT bl.id, bl.loan_date as "borrowDate", bl.return_date as "returnDate", 
             bl.due_date as "dueDate", bl.status, bl.late_fee as "lateFee",
             b.title, b.author, b.cover_image as thumbnail,
             c.barcode
      FROM book_loans bl
      JOIN books b ON bl.book_id = b.id
      LEFT JOIN publication_copies c ON bl.copy_id = c.id
      WHERE bl.member_id = $1 AND b.is_digital = false
      ORDER BY bl.loan_date DESC
      LIMIT $2 OFFSET $3
    `;
    
    const { rows } = await pool.query(query, [readerId, limit, offset]);

    const { rows: countRes } = await pool.query(
      'SELECT COUNT(*) FROM book_loans bl JOIN books b ON bl.book_id = b.id WHERE bl.member_id = $1 AND b.is_digital = false',
      [readerId]
    );
    const totalItems = parseInt(countRes[0].count);

    return res.json({ 
      success: true, 
      message: "Lấy danh sách lịch sử mượn trả thành công",
      data: rows, 
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      },
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};

// 8. Lịch sử Tài chính (Transactions)
exports.getTransactions = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(`
      SELECT id, ABS(amount) as amount, type, status, notes as description, transaction_id as "txnId", created_at as "createdAt"
      FROM payments
      WHERE member_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [readerId, limit, offset]);

    const { rows: countRes } = await pool.query('SELECT COUNT(*) FROM payments WHERE member_id = $1', [readerId]);
    const totalItems = parseInt(countRes[0].count);

    return res.json({ 
      success: true, 
      message: "Lấy danh sách giao dịch tài chính thành công",
      data: rows, 
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      },
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};

// 9. Lịch sử Thẻ (Membership Requests)
exports.getMembershipRequests = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(`
      SELECT 
        mr.id, mr.status, mr.amount, mr.request_note as note, 
        mr.created_at as "createdAt", mr.transaction_id as "txnId",
        mp.name as "planName"
      FROM membership_requests mr
      JOIN membership_plans mp ON mr.plan_id = mp.id
      WHERE mr.member_id = $1
      ORDER BY mr.created_at DESC
      LIMIT $2 OFFSET $3
    `, [readerId, limit, offset]);

    const { rows: countRes } = await pool.query('SELECT COUNT(*) FROM membership_requests WHERE member_id = $1', [readerId]);
    const totalItems = parseInt(countRes[0].count);

    return res.json({ 
      success: true, 
      message: "Lấy danh sách yêu cầu đăng ký/gia hạn thành công",
      data: rows, 
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      },
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};
