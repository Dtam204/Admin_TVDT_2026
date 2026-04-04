const { pool } = require('../config/database');
const { logActivity } = require('./member_actions.controller');
const { processMembershipUpgrade } = require('../services/membership_upgrade.service');
const AuditService = require('../services/admin/audit.service');

/**
 * Membership Requests Controller
 * Handles the workflow: Reader Request -> Admin Review -> Approval/Rejection
 */

// GET /api/admin/membership-requests
exports.getAll = async (req, res, next) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        mr.*, 
        m.full_name as member_name, 
        m.card_number,
        mp.name as plan_name,
        mp.price as plan_price,
        mp.duration_days as plan_duration,
        u.name as processor_name
      FROM membership_requests mr
      JOIN members m ON mr.member_id = m.id
      LEFT JOIN membership_plans mp ON mr.plan_id = mp.id
      LEFT JOIN users u ON mr.processed_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND mr.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY mr.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    
    // Count total for pagination
    const countRes = await pool.query('SELECT COUNT(*) FROM membership_requests' + (status ? ' WHERE status = $1' : ''), status ? [status] : []);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: parseInt(countRes.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/reader/renew-request
exports.submitRequest = async (req, res, next) => {
  try {
    const { plan_id, request_note } = req.body;
    const member_id = req.user?.member_id || req.body.member_id;

    if (!member_id) {
      return res.status(400).json({ success: false, message: 'Không xác định được hội viên' });
    }

    // 1. Get member balance and plan price
    const { rows: members } = await pool.query('SELECT balance FROM members WHERE id = $1', [member_id]);
    if (members.length === 0) throw new Error('Không tìm thấy hội viên');
    const memberBalance = parseFloat(members[0].balance || 0);

    let amount = 0;
    if (plan_id) {
      const { rows: plans } = await pool.query('SELECT price FROM membership_plans WHERE id = $1', [plan_id]);
      if (plans.length === 0) throw new Error('Gói hội viên không hợp lệ');
      amount = parseFloat(plans[0].price || 0);
    }

    // 2. Enforce balance rule for readers (self-service)
    if (memberBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần nạp tiền vào thẻ để thanh toán nâng cấp',
        required_amount: amount,
        current_balance: memberBalance,
        shortfall: amount - memberBalance
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO membership_requests (member_id, plan_id, request_note, amount, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [member_id, plan_id, request_note, amount]
    );

    await logActivity(member_id, 'membership_request', `Gửi yêu cầu gia hạn gói (Plan ID: ${plan_id || 'N/A'}, Số tiền: ${amount}đ)`, req.ip, req.headers['user-agent']);

    return res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu gia hạn thành công. Vui lòng chờ Admin phê duyệt.',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/membership-requests/:id/approve
exports.approve = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { admin_note, manual_days, processed_by } = req.body;

    // 1. Get request detail
    const { rows: requests } = await client.query(
      'SELECT mr.* FROM membership_requests mr WHERE mr.id = $1', [id]
    );

    if (requests.length === 0) throw new Error('Không tìm thấy yêu cầu');
    const request = requests[0];
    if (request.status !== 'pending') throw new Error('Yêu cầu này đã được xử lý trước đó');

    // 2. Use the shared service to process upgrade
    const result = await processMembershipUpgrade({
      memberId: request.member_id,
      planId: request.plan_id,
      manualDays: manualDays ? parseInt(manualDays) : 0, // Service handles plan default + manual
      note: admin_note || `Đã phê duyệt gia hạn qua Admin.`,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'completed'
    }, client);

    // 3. Update Request Status
    await client.query(
      `UPDATE membership_requests 
       SET status = 'approved', 
           admin_note = $1, 
           processed_by = $2, 
           processed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [admin_note, processed_by || null, id]
    );

    // 4. Log activity
    await logActivity(request.member_id, 'membership_approved', `Đã phê duyệt gia hạn thêm ${result.daysAdded} ngày.`, req.ip, req.headers['user-agent'], client);

    const adminId = req.user?.id || processed_by || null;
    if (adminId) {
      await AuditService.log(adminId, 'APPROVE_MEMBERSHIP', 'MEMBERSHIP_REQUEST', id, request, result);
    }

    await client.query('COMMIT');
    return res.json({
      success: true,
      message: `Đã phê duyệt gia hạn thêm ${result.daysAdded} ngày. Ngày hết hạn mới: ${result.newExpires}`,
      data: result
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// POST /api/membership/manual-activate/:id
// Admin manually activates a request (e.g. after verifying a legacy bank transfer)
exports.handleManualActivation = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params; // Request ID

    // 1. Get request detail
    const { rows: requests } = await client.query(
      'SELECT * FROM membership_requests WHERE id = $1', [id]
    );

    if (requests.length === 0) throw new Error('Không tìm thấy đơn hàng');
    const request = requests[0];
    if (request.status !== 'pending') throw new Error('Đơn hàng đã được xử lý trước đó');

    // 2. Automated upgrade 
    const result = await processMembershipUpgrade({
      memberId: request.member_id,
      planId: request.plan_id,
      note: `Kích hoạt thủ công bởi Admin (Xác nhận chuyển khoản)`,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'completed'
    }, client);

    // 3. Update Request status to approved automatically
    await client.query(
      `UPDATE membership_requests 
       SET status = 'approved', 
           admin_note = 'Admin đã xác nhận thanh toán và kích hoạt thủ công.', 
           processed_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    // 4. Log activity
    await logActivity(request.member_id, 'membership_manual_success', `Duyệt kích hoạt gói thành công (${result.daysAdded} ngày).`, req.ip, req.headers['user-agent'], client);

    const adminId = req.user?.id || null;
    if (adminId) {
      await AuditService.log(adminId, 'MANUAL_ACTIVATE', 'MEMBERSHIP_REQUEST', id, request, result);
    }

    await client.query('COMMIT');
    return res.json({
      success: true,
      message: 'Kích hoạt thành công! Gói hội viên đã được cập nhật.',
      data: result
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};


// PATCH /api/admin/membership-requests/:id/reject
exports.reject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_note, processed_by } = req.body;

    // Get member_id for logging
    const { rows: reqRows } = await pool.query('SELECT member_id FROM membership_requests WHERE id = $1', [id]);
    if (reqRows.length > 0) {
      const memberId = reqRows[0].member_id;
      
      await pool.query(
        `UPDATE membership_requests 
         SET status = 'rejected', admin_note = $1, processed_by = $2, processed_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND status = 'pending'`,
        [admin_note, processed_by, id]
      );

      await logActivity(memberId, 'renewal_rejected', `Đã từ chối yêu cầu gia hạn. Lý do: ${admin_note || 'N/A'}`, req.ip, req.headers['user-agent']);

      const adminId = req.user?.id || processed_by || null;
      if (adminId) {
        await AuditService.log(adminId, 'REJECT_MEMBERSHIP', 'MEMBERSHIP_REQUEST', id, { note: admin_note }, { status: 'rejected' });
      }
    }

    return res.json({
      success: true,
      message: 'Đã từ chối yêu cầu gia hạn'
    });
  } catch (error) {
    next(error);
  }
};
