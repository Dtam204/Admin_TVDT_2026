const { pool } = require('../config/database');
const { logActivity } = require('./member_actions.controller');
const { generateTransactionId } = require('../utils/id_helper');

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
        mp.name->>'vi' as plan_name,
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
    const { member_id, plan_id, request_note } = req.body;

    if (!member_id) {
      throw new Error('Member ID là bắt buộc');
    }

    const { rows } = await pool.query(
      `INSERT INTO membership_requests (member_id, plan_id, request_note, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [member_id, plan_id, request_note]
    );

    await logActivity(member_id, 'renewal_request', `Gửi yêu cầu gia hạn gói (Plan ID: ${plan_id || 'N/A'})`, req.ip, req.headers['user-agent']);

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
      'SELECT mr.*, mp.duration_days FROM membership_requests mr LEFT JOIN membership_plans mp ON mr.plan_id = mp.id WHERE mr.id = $1',
      [id]
    );

    if (requests.length === 0) throw new Error('Không tìm thấy yêu cầu');
    const request = requests[0];
    if (request.status !== 'pending') throw new Error('Yêu cầu này đã được xử lý trước đó');

    // 2. Calculate new expiration date
    const daysToAdd = manual_days ? parseInt(manual_days) : (request.duration_days || 30);
    
    // Get current member expiration
    const { rows: members } = await client.query('SELECT membership_expires FROM members WHERE id = $1', [request.member_id]);
    const member = members[0];
    
    let baseDate = new Date();
    // If current expiration is in the future, add from there. Otherwise, add from today.
    if (member.membership_expires && new Date(member.membership_expires) > new Date()) {
      baseDate = new Date(member.membership_expires);
    }
    
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const newExpires = baseDate.toISOString().split('T')[0];

    // 3. Update Member
    await client.query(
      'UPDATE members SET membership_expires = $1, status = \'active\' WHERE id = $2',
      [newExpires, request.member_id]
    );

    // 5. Ghi nhận doanh thu (Finance Revenue Sync)
    const { rows: planRows } = await client.query('SELECT price, name->>\'vi\' as plan_name FROM membership_plans WHERE id = $1', [request.plan_id]);
    const plan = planRows[0];
    
    if (plan && parseFloat(plan.price) > 0) {
      await client.query(`
        INSERT INTO payments (
          member_id, amount, type, status, notes, transaction_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      `, [
        request.member_id,
        plan.price,
        'plan_subscription',
        'completed', // Vì Admin đã phê duyệt tức là đã thu tiền (hoặc xác nhận thu)
        `Phí đăng ký gói ${plan.plan_name || 'Hội viên'} (${daysToAdd} ngày)`,
        generateTransactionId('SUB')
      ]);
    }

    // 6. Log activity
    await logActivity(request.member_id, 'renewal_approved', `Đã phê duyệt gia hạn ${daysToAdd} ngày. Ghi chú: ${admin_note || 'N/A'}`, req.ip, req.headers['user-agent'], client);

    await client.query('COMMIT');
    return res.json({
      success: true,
      message: `Đã phê duyệt gia hạn thêm ${daysToAdd} ngày. Ngày hết hạn mới: ${newExpires}`
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
    }

    return res.json({
      success: true,
      message: 'Đã từ chối yêu cầu gia hạn'
    });
  } catch (error) {
    next(error);
  }
};
