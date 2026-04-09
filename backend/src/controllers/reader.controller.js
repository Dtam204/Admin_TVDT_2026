const readerAuthService = require('../services/reader/auth.service');
const readerService = require('../services/reader/reader.service');
const { pool } = require('../config/database');
const { generateTransactionId } = require('../utils/id_helper');

const ORDER_EXPIRE_MINUTES = Number(process.env.ORDER_EXPIRE_MINUTES || 30);

/**
 * Reader Controller - CHUẨN HÓA RESTFUL CHUYÊN NGHIỆP (FINAL SYNC)
 * Đảm bảo: 100% API trả về 7 trường meta và dữ liệu chuẩn snake_case.
 */

// Helper để tạo response chuẩn 7 trường
const sendResponse = (res, status, message, data = null, errors = null, pagination = null) => {
  const response = {
    code: status >= 200 && status < 300 ? 0 : status,
    success: status >= 200 && status < 300,
    message: message,
    data: data,
    errorId: null,
    appId: null,
    errors: errors
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(status).json(response);
};

// Helper định dạng ngày
const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : null;

const normalizePagination = (pageInput, limitInput) => {
  const page = Math.max(parseInt(pageInput, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(limitInput, 10) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

// 1. Đăng nhập (Thẻ hoặc Email)
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return sendResponse(res, 400, 'Vui lòng cung cấp đầy đủ mã thẻ/email và mật khẩu', null, ['Missing credentials']);
    }

    const result = await readerAuthService.authenticateReader({ identifier, password });
    if (!result) {
      return sendResponse(res, 401, 'Thông tin tài khoản hoặc mật khẩu không chính xác', null, ['Invalid credentials']);
    }

    return sendResponse(res, 200, 'Đăng nhập thành công', result);
  } catch (error) {
    return next(error);
  }
};

// 1.1. Làm mới Token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendResponse(res, 400, 'Vui lòng cung cấp Refresh Token', null, ['Missing token']);
    }

    const result = await readerAuthService.refreshReaderToken(refreshToken);
    return sendResponse(res, 200, 'Làm mới token thành công', result);
  } catch (error) {
    return sendResponse(res, 401, error.message || 'Phiên đăng nhập đã hết hạn', null, [error.message]);
  }
};

// 2. Lấy thông tin cá nhân (Profile 360)
exports.getProfile = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const profile = await readerService.getProfile(readerId);
    
    if (!profile) {
      return sendResponse(res, 404, "Tài khoản không tồn tại trên hệ thống", null, ['Not found']);
    }

    return sendResponse(res, 200, "Lấy thông tin hồ sơ thành công", profile);
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

    return sendResponse(res, 200, "Hồ sơ của bạn đã được cập nhật thành công", data);
  } catch (error) {
    const status = error.message.includes('đã được sử dụng') ? 400 : 500;
    return sendResponse(res, status, error.message, null, [error.message]);
  }
};

// 4. Đăng xuất (Thu hồi Refresh Token)
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendResponse(res, 400, "Vui lòng cung cấp mã xác thực để đăng xuất", null, ['Missing token']);
    }

    await readerAuthService.revokeRefreshToken(refreshToken);
    return sendResponse(res, 200, "Đăng xuất thành công");
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
      return sendResponse(res, 404, "Không tìm thấy thông tin bạn đọc", null, ['Not found']);
    }

    await readerAuthService.logoutAllDevices(member[0].user_id);
    return sendResponse(res, 200, "Bạn đã đăng xuất khỏi tất cả các thiết bị thành công");
  } catch (error) {
    return next(error);
  }
};

// 5. Luồng Quên mật khẩu & OTP
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await readerService.generateOTP(email);
    // Trả về email và expires_in chuẩn snake_case
    return sendResponse(res, 200, "Mã OTP xác thực đã được gửi đến email của bạn", result);
  } catch (error) {
    return sendResponse(res, 400, error.message, null, [error.message]);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    const result = await readerService.verifyOTP(email, otpCode);
    return sendResponse(res, 200, "Xác thực mã OTP thành công", result);
  } catch (error) {
    return sendResponse(res, 400, error.message, null, [error.message]);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return sendResponse(res, 400, "Mật khẩu xác nhận không khớp", null, ['Password mismatch']);
    }
    const result = await readerService.resetPassword(email, newPassword);
    return sendResponse(res, 200, "Đặt lại mật khẩu thành công. Vui lòng sử dụng mật khẩu mới để đăng nhập.", result);
  } catch (error) {
    return sendResponse(res, 400, error.message, null, [error.message]);
  }
};

// 6. Đổi mật khẩu ngay trong App
exports.changePassword = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return sendResponse(res, 400, "Mật khẩu xác minh không trùng khớp", null, ['Password mismatch']);
    }
    await readerService.changePassword(readerId, oldPassword, newPassword);
    return sendResponse(res, 200, "Mật khẩu của bạn đã được thay đổi thành công");
  } catch (error) {
    return sendResponse(res, 400, error.message, null, [error.message]);
  }
};

// 7. Lịch sử Mượn trả (Physical Loans)
exports.getBorrowHistory = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const { page = 1, limit = 10 } = req.query;
    const paging = normalizePagination(page, limit);

    const query = `
      SELECT bl.id, bl.loan_date as borrow_date, bl.return_date, 
             bl.due_date, bl.status, bl.late_fee,
             b.title, b.author, b.cover_image as thumbnail,
             c.barcode
      FROM book_loans bl
      JOIN books b ON bl.book_id = b.id
      LEFT JOIN publication_copies c ON bl.copy_id = c.id
      WHERE bl.member_id = $1 AND b.is_digital = false
      ORDER BY bl.loan_date DESC
      LIMIT $2 OFFSET $3
    `;
    
    const { rows } = await pool.query(query, [readerId, paging.limit, paging.offset]);
    
    const formattedData = rows.map(item => ({
      ...item,
      borrow_date: formatDate(item.borrow_date),
      return_date: formatDate(item.return_date),
      due_date: formatDate(item.due_date),
      late_fee: parseFloat(item.late_fee || 0)
    }));

    const { rows: countRes } = await pool.query(
      'SELECT COUNT(*) FROM book_loans bl JOIN books b ON bl.book_id = b.id WHERE bl.member_id = $1 AND b.is_digital = false',
      [readerId]
    );
    const totalItems = parseInt(countRes[0].count);

    return sendResponse(res, 200, "Lấy danh sách lịch sử mượn trả thành công", formattedData, null, {
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / paging.limit),
      current_page: paging.page,
      limit: paging.limit
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
    const paging = normalizePagination(page, limit);

    const { rows } = await pool.query(`
      SELECT id, ABS(amount) as amount, type, status, notes as description, transaction_id, created_at
      FROM payments
      WHERE member_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [readerId, paging.limit, paging.offset]);

    const formattedData = rows.map(item => ({
      ...item,
      amount: parseFloat(item.amount || 0),
      created_at: formatDate(item.created_at)
    }));

    const { rows: countRes } = await pool.query('SELECT COUNT(*) FROM payments WHERE member_id = $1', [readerId]);
    const totalItems = parseInt(countRes[0].count);

    return sendResponse(res, 200, "Lấy danh sách giao dịch tài chính thành công", formattedData, null, {
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / paging.limit),
      current_page: paging.page,
      limit: paging.limit
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
    const paging = normalizePagination(page, limit);

    const { rows } = await pool.query(`
      SELECT 
        mr.id, mr.status, mr.amount, mr.request_note as note, 
        mr.created_at, mr.transaction_id,
        mp.name as plan_name
      FROM membership_requests mr
      JOIN membership_plans mp ON mr.plan_id = mp.id
      WHERE mr.member_id = $1
      ORDER BY mr.created_at DESC
      LIMIT $2 OFFSET $3
    `, [readerId, paging.limit, paging.offset]);

    const formattedData = rows.map(item => ({
      ...item,
      amount: parseFloat(item.amount || 0),
      created_at: formatDate(item.created_at)
    }));

    const { rows: countRes } = await pool.query('SELECT COUNT(*) FROM membership_requests WHERE member_id = $1', [readerId]);
    const totalItems = parseInt(countRes[0].count);

    return sendResponse(res, 200, "Lấy danh sách yêu cầu đăng ký/gia hạn thành công", formattedData, null, {
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / paging.limit),
      current_page: paging.page,
      limit: paging.limit
    });
  } catch (error) {
    return next(error);
  }
};

// ============================================================================
// WALLET & PAYMENT API (NEW ARCHITECTURE)
// ============================================================================

// 10. Lấy số dư ví (Tổng tiền thực tế)
exports.getWalletBalance = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const { rows } = await pool.query('SELECT balance FROM members WHERE id = $1', [readerId]);
    
    if (rows.length === 0) {
       return sendResponse(res, 404, "Không tìm thấy thông tin ví", null, ['Not found']);
    }

    return sendResponse(res, 200, "Lấy số dư thành công", {
      balance: parseFloat(rows[0].balance || 0)
    });
  } catch (error) {
    return next(error);
  }
};

// 11. Yêu cầu Nạp tiền (Lấy mã QR chuẩn bị chuyển khoản)
exports.requestDeposit = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const amount = Number(req.body?.amount || 0);

    if (!Number.isFinite(amount) || amount < 10000) {
      return sendResponse(res, 400, "Số tiền nạp tối thiểu là 10.000đ", null, ['Invalid amount']);
    }

    const requestTime = Date.now();
    const transferCode = `NAP-R${readerId}-${requestTime}`;
    const clientReference = transferCode;

    const { rows } = await pool.query(`
      INSERT INTO wallet_deposit_orders (
        member_id, amount, client_reference, transfer_code, status, expires_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'pending',
        CURRENT_TIMESTAMP + ($5::text || ' minutes')::interval
      )
      RETURNING id, amount, client_reference, transfer_code, status, expires_at, created_at
    `, [readerId, amount, clientReference, transferCode, ORDER_EXPIRE_MINUTES]);

    const order = rows[0];

    return sendResponse(res, 200, "Khởi tạo lệnh nạp tiền thành công", {
      deposit_id: order.id,
      amount: parseFloat(order.amount || 0),
      client_reference: order.client_reference,
      transfer_code: order.transfer_code,
      status: order.status,
      expires_at: order.expires_at,
      created_at: order.created_at,
      bank_info: {
        bank_name: "MB Bank (Ngân hàng Quân Đội)",
        account_number: "032902092004",
        account_holder: "LE QUOC TAM",
        branch: "HÀ NỘI"
      },
      message: `Vui lòng chuyển khoản ${amount.toLocaleString()}đ với nội dung: ${order.transfer_code}`
    });
  } catch (error) {
    if (error?.code === '23505') {
      return sendResponse(res, 409, 'Lệnh nạp bị trùng, vui lòng tạo lại', null, ['Duplicate transfer code']);
    }
    return next(error);
  }
};

// 11.1. Kiểm tra trạng thái lệnh nạp
exports.getDepositOrderStatus = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const depositId = Number(req.params.depositId || 0);

    if (!depositId || depositId <= 0) {
      return sendResponse(res, 400, 'Mã lệnh nạp không hợp lệ', null, ['Invalid depositId']);
    }

    const { rows } = await pool.query(`
      SELECT o.*, m.balance AS current_balance
      FROM wallet_deposit_orders o
      JOIN members m ON m.id = o.member_id
      WHERE o.id = $1 AND o.member_id = $2
      LIMIT 1
    `, [depositId, readerId]);

    if (rows.length === 0) {
      return sendResponse(res, 404, 'Không tìm thấy lệnh nạp', null, ['Not found']);
    }

    const order = rows[0];
    return sendResponse(res, 200, 'Lấy trạng thái lệnh nạp thành công', {
      deposit_id: order.id,
      amount: parseFloat(order.amount || 0),
      client_reference: order.client_reference,
      transfer_code: order.transfer_code,
      status: order.status,
      matched_external_txn_id: order.matched_external_txn_id,
      failure_reason: order.failure_reason,
      credited_at: order.credited_at,
      expires_at: order.expires_at,
      created_at: order.created_at,
      updated_at: order.updated_at,
      current_wallet_balance: parseFloat(order.current_balance || 0)
    });
  } catch (error) {
    return next(error);
  }
};

// 12. Danh sách Phiếu Phạt đang chờ đóng
exports.getPendingFines = async (req, res, next) => {
  try {
    const readerId = req.user.sub;
    const { rows } = await pool.query(`
      SELECT id, ABS(amount) as amount, notes as description, created_at, transaction_id
      FROM payments
      WHERE member_id = $1 AND type = 'fee_penalty' AND status = 'pending'
      ORDER BY created_at DESC
    `, [readerId]);

    const formattedData = rows.map(item => ({
      ...item,
      amount: parseFloat(item.amount || 0),
      created_at: formatDate(item.created_at)
    }));

    return sendResponse(res, 200, "Lấy danh sách phiếu phạt thành công", formattedData);
  } catch (error) {
    return next(error);
  }
};

// 13. Đóng Phạt bằng Số dư Ví (Trừ ví nội bộ)
exports.payFine = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const readerId = req.user.sub;
    const { fineId } = req.params;

    await client.query('BEGIN');

    // 1. Kiểm tra Phiếu phạt
    const { rows: fines } = await client.query(`
      SELECT * FROM payments WHERE id = $1 AND member_id = $2 AND type = 'fee_penalty' AND status = 'pending'
    `, [fineId, readerId]);

    if (fines.length === 0) {
       await client.query('ROLLBACK');
       return sendResponse(res, 404, "Không tìm thấy phiếu phạt, hoặc phiếu đã được thanh toán", null, ['Invalid fine']);
    }
    const fineAmount = Math.abs(parseFloat(fines[0].amount));

    // 2. Kiểm tra Số dư Ví
    const { rows: members } = await client.query('SELECT balance FROM members WHERE id = $1 FOR UPDATE', [readerId]);
    const currentBalance = parseFloat(members[0].balance || 0);

    if (currentBalance < fineAmount) {
      await client.query('ROLLBACK');
      return sendResponse(res, 400, "Số dư trong ví không đủ. Vui lòng nạp thêm tiền.", null, ['Insufficient balance']);
    }

    // 3. Trừ tiền ví
    await client.query('UPDATE members SET balance = balance - $1 WHERE id = $2', [fineAmount, readerId]);

    // 4. Đánh dấu Phiếu phạt đã đóng
    await client.query('UPDATE payments SET status = $1, paid_at = CURRENT_TIMESTAMP WHERE id = $2', ['completed', fineId]);

    // 5. Ghi log hoạt động
    await client.query(
      'INSERT INTO member_activities (member_id, activity_type, description) VALUES ($1, $2, $3)',
      [readerId, 'fine_paid', `Thanh toán thành công phiếu phạt #${fineId} qua Ví điện tử (Số tiền: ${fineAmount}đ)`]
    );

    // [Socket] Đồng bộ số dư mới về App
    try {
      const { getIO } = require('../socket');
      const { rows: memRows } = await client.query('SELECT balance, full_name FROM members WHERE id = $1', [readerId]);
      const io = getIO();
      
      // Báo cho App của chính bạn đọc đó
      io.to(`member_${readerId}`).emit('wallet_balance_updated', {
        amount: -fineAmount,
        new_balance: parseFloat(memRows[0].balance || 0),
        message: `Bạn vừa thanh toán phiếu phạt ${fineAmount.toLocaleString()}đ`
      });

      // Thông báo cho Admin CMS
      io.to('admins').emit('new_transaction', {
        id: fineId,
        type: 'FINE_PAYMENT',
        member_name: memRows[0].full_name,
        amount: fineAmount,
        message: `Hội viên ${memRows[0].full_name} vừa đóng phạt ${fineAmount.toLocaleString()} VNĐ qua Ví`
      });
    } catch(e) {}

    await client.query('COMMIT');
    return sendResponse(res, 200, "Đóng tiền phạt thành công", {
      new_balance: (currentBalance - fineAmount)
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// 14. Đăng ký / Gia hạn gói thẻ bằng Số dư Ví (Trừ ví nội bộ)
exports.upgradeMembership = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const readerId = req.user.sub;
    const { planId } = req.body;

    if (!planId) {
      return sendResponse(res, 400, "Vui lòng chọn gói thẻ cần đăng ký", null, ['Missing planId']);
    }

    await client.query('BEGIN');

    // 1. Phân tích Plan
    const { rows: plans } = await client.query('SELECT price, duration_days, name as plan_name FROM membership_plans WHERE id = $1 AND status = \'active\'', [planId]);
    if (plans.length === 0) {
      await client.query('ROLLBACK');
       return sendResponse(res, 404, "Không tìm thấy gói thẻ hoặc gói đã bị ẩn", null, ['Invalid plan']);
    }
    const planDetails = plans[0];
    const planPrice = parseFloat(planDetails.price || 0);

    // 2. Kiểm tra Số dư Ví
    const { rows: members } = await client.query('SELECT balance, membership_expires FROM members WHERE id = $1 FOR UPDATE', [readerId]);
    const currentBalance = parseFloat(members[0].balance || 0);

    if (currentBalance < planPrice) {
      await client.query('ROLLBACK');
      return sendResponse(res, 400, "Số dư trong ví không đủ để đăng ký gói này. Vui lòng nạp thêm tiền.", null, ['Insufficient balance']);
    }

    // 3. Trừ tiền ví
    if (planPrice > 0) {
       await client.query('UPDATE members SET balance = balance - $1 WHERE id = $2', [planPrice, readerId]);
    }

    // 4. Tính toán ngày hết hạn mới
    const currentExpires = members[0].membership_expires;
    let baseDate = new Date();
    if (currentExpires && new Date(currentExpires) > new Date()) {
      baseDate = new Date(currentExpires);
    }
    baseDate.setDate(baseDate.getDate() + planDetails.duration_days);
    const newExpires = baseDate.toISOString().split('T')[0];

    // Cập nhật trạng thái thành viên
    await client.query(
      'UPDATE members SET membership_expires = $1, membership_plan_id = $2, status = \'active\' WHERE id = $3',
      [newExpires, planId, readerId]
    );

    // 5. Ghi nhận giao dịch vào Payments
    const { rows: payRows } = await client.query(`
      INSERT INTO payments (member_id, amount, type, status, notes, payment_method, transaction_id, created_at)
      VALUES ($1, $2, 'membership', 'completed', $3, 'wallet', $4, CURRENT_TIMESTAMP)
      RETURNING id, transaction_id
    `, [readerId, planPrice, `Đăng ký gói ${planDetails.plan_name} (${planDetails.duration_days} ngày) bằng Ví`, generateTransactionId('MEM')]);

    // 5a. Đồng bộ vào Membership Requests để hiện lịch sử mua gói trên App
    await client.query(`
      INSERT INTO membership_requests (member_id, plan_id, amount, status, request_note, transaction_id, created_at)
      VALUES ($1, $2, $3, 'approved', $4, $5, CURRENT_TIMESTAMP)
    `, [readerId, planId, planPrice, `Gia hạn tự động qua Ví: ${planDetails.plan_name}`, payRows[0].transaction_id]);

    // 6. Push Socket Event (App & Admin sync)
    try {
      const { getIO } = require('../socket');
      const { rows: memberData } = await client.query('SELECT balance, full_name FROM members WHERE id = $1', [readerId]);
      const io = getIO();

      // Báo về máy Bạn đọc
      io.to(`member_${readerId}`).emit('wallet_balance_updated', {
        amount: -planPrice,
        new_balance: parseFloat(memberData[0].balance || 0),
        message: `Gia hạn thẻ thành công! Bạn đã đăng ký gói ${planDetails.plan_name}`
      });

      // Báo cho Admin có đăng ký mới
      getIO().to('admins').emit('new_transaction', {
        id: payRows[0].id,
        type: 'MEMBERSHIP_UPGRADE',
        member_name: memberData[0].full_name,
        amount: planPrice,
        message: `Hội viên ${memberData[0].full_name} vừa gia hạn gói ${planDetails.plan_name}`
      });
    } catch(err) {}

    await client.query('COMMIT');
    return sendResponse(res, 200, `Gia hạn gói hội viên thành công! Thẻ có hiệu lực đến ${newExpires}`, {
      new_balance: (currentBalance - planPrice),
      expiry_date: newExpires
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

// 15. Lấy danh sách Gói thẻ Hội viên (Hạng thẻ)
exports.getMembershipPlans = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name as plan_name, price, duration_days, description 
      FROM membership_plans 
      WHERE status = 'active' 
      ORDER BY price ASC
    `);
    
    return sendResponse(res, 200, "Lấy danh sách hạng thẻ thành công", rows);
  } catch (error) {
    return next(error);
  }
};
