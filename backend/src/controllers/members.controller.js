const { pool } = require('../config/database');
const { logActivity } = require('./member_actions.controller');
const { generateTransactionId } = require('../utils/id_helper');
const { getEffectiveMembership } = require('../utils/member_helper');

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

const bcrypt = require('bcryptjs');

// GET /api/admin/members
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, inactive_only } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        m.*, 
        mp.name as membership_plan_name,
        mp.max_books_borrowed,
        mp.tier_code
      FROM members m
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (m.full_name ILIKE $${paramIndex} OR m.email ILIKE $${paramIndex} OR m.card_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status && status !== 'all' && status !== 'undefined') {
      query += ` AND m.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (inactive_only === 'true') {
      query += ` AND (m.last_activity_at < NOW() - INTERVAL '1 year' OR m.last_activity_at IS NULL)`;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);

    // Process effective membership for each member
    const data = rows.map(row => {
      const effective = getEffectiveMembership({
        membership_expires: row.membership_expires,
        tier_code: row.tier_code || 'basic',
        plan_name: row.membership_plan_name || 'Cơ bản',
        max_books_borrowed: row.max_books_borrowed || 3
      });
      return {
        ...row,
        effective_plan: effective.plan_name,
        is_expired: effective.is_expired,
        effective_tier: effective.tier_code
      };
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM members WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (full_name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex} OR card_number ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (status && status !== 'all' && status !== 'undefined') {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (inactive_only === 'true') {
      countQuery += ` AND (last_activity_at < NOW() - INTERVAL '1 year' OR last_activity_at IS NULL)`;
    }

    const { rows: countRows } = await pool.query(countQuery, countParams);

    return res.json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countRows[0].total),
        totalPages: Math.ceil(parseInt(countRows[0].total) / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/members/:id
exports.getById = async (req, res, next) => {
  const { id } = req.params;
  
  // Type check: Nếu id không phải là số, bỏ qua để Express xử lý route tiếp theo (nếu có) hoặc báo lỗi 400
  if (isNaN(parseInt(id))) {
     console.log('[DEBUG] getById ignored non-numeric ID:', id);
     return next(); // Cho phép các middleware hoặc error handler khác xử lý
  }

  console.log('[DEBUG] Hit getById with ID:', id);
  try {
    const { rows } = await pool.query(`
      SELECT 
        m.*, 
        mp.name as plan_name_json,
        mp.tier_code,
        mp.max_books_borrowed,
        u.status as user_status,
        u.role_id,
        r.name as role_name
      FROM members m
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE m.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Bạn đọc',
      });
    }

    const member = rows[0];
    
    // Process effective membership
    const effective = getEffectiveMembership({
      membership_expires: member.membership_expires,
      tier_code: member.tier_code || 'basic',
      plan_name: member.plan_name_json?.vi || member.plan_name_json || 'Cơ bản',
      max_books_borrowed: member.max_books_borrowed || 3
    });
    
    member.effective_plan = effective.plan_name;
    member.is_expired = effective.is_expired;
    member.effective_tier = effective.tier_code;

    // Clean up plan name for UI
    member.membership_plan_name = member.plan_name_json?.vi || member.plan_name_json || '';
    
    // Phase 1 Profile 360 UI Stats
    const { rows: loanStats } = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status IN ('borrowing', 'overdue')) as current_loans_count,
        SUM(late_fee) as total_fines
      FROM book_loans
      WHERE member_id = $1
    `, [id]);
    
    member.currentLoansCount = parseInt(loanStats[0]?.current_loans_count || 0);
    member.totalFines = parseFloat(loanStats[0]?.total_fines || 0);

    return res.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error('Get Member Detail Error:', error);
    next(error);
  }
};

// POST /api/admin/members
exports.create = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { 
      email, password, full_name, phone, address, 
      card_number, membership_plan_id, identity_number, 
      date_of_birth, gender, status = 'active',
      membership_expires, card_type_id, issued_date, 
      is_verified = false, balance = 0
    } = req.body;

    if (!email || !full_name || !card_number) {
      throw new Error('Email, Họ tên và Mã số thẻ là bắt buộc');
    }

    // 1. Check if email already exists in members
    const { rows: existingMember } = await client.query('SELECT id FROM members WHERE email = $1', [email.toLowerCase()]);
    if (existingMember.length > 0) {
      throw new Error('Email này đã được đăng ký cho một bạn đọc khác');
    }

    // Check if card_number already exists
    const { rows: existingCard } = await client.query('SELECT id FROM members WHERE card_number = $1', [card_number]);
    if (existingCard.length > 0) {
      throw new Error(`Mã số thẻ "${card_number}" đã được cấp cho một bạn đọc khác`);
    }

    // 2. Resolve or Create User
    let userId;
    const { rows: existingUser } = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    
    if (existingUser.length > 0) {
        // Use existing user
        userId = existingUser[0].id;
    } else {
        // Create new user
        const readerRole = await client.query("SELECT id FROM roles WHERE code = 'user' LIMIT 1");
        const roleId = readerRole.rows[0]?.id;

        if (!roleId) {
            throw new Error('Hệ thống thiếu cấu hình Role "user". Vui lòng liên hệ Admin.');
        }

        const hashedPassword = await bcrypt.hash(password || '123456', 10);
        const { rows: userRows } = await client.query(
            `INSERT INTO users (email, password, name, role_id, status) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [email.toLowerCase(), hashedPassword, full_name, roleId, status]
        );
        userId = userRows[0].id;
    }

    // 3. Create Member linked to User
    const sanitizedPlanId = membership_plan_id && membership_plan_id !== '' && !isNaN(parseInt(membership_plan_id)) 
        ? parseInt(membership_plan_id) : null;
    const sanitizedDob = date_of_birth && date_of_birth !== '' ? date_of_birth : null;
    const sanitizedIssued = issued_date && issued_date !== '' ? issued_date : null;
    const sanitizedCardType = card_type_id && card_type_id !== '' ? parseInt(card_type_id) : null;

    // Automatic calculation for new members
    let finalExpires = membership_expires && membership_expires !== '' ? membership_expires : null;
    
    if (!finalExpires && sanitizedPlanId) {
        const { rows: planRows } = await client.query('SELECT duration_days FROM membership_plans WHERE id = $1', [sanitizedPlanId]);
        if (planRows.length > 0) {
            const duration = planRows[0].duration_days || 30;
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + duration);
            finalExpires = expDate.toISOString().split('T')[0];
        }
    }

    const { rows: memberRows } = await client.query(
      `INSERT INTO members (
        user_id, full_name, email, phone, address, 
        card_number, membership_plan_id, identity_number, 
        date_of_birth, gender, status,
        membership_expires, card_type_id, issued_date,
        is_verified, balance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        userId, full_name, email.toLowerCase(), phone || null, address || null, 
        card_number, sanitizedPlanId, identity_number || null, 
        sanitizedDob, gender || 'other', status || 'active',
        finalExpires, sanitizedCardType, sanitizedIssued,
        is_verified, balance
      ]
    );

    const newMember = memberRows[0];

    // 4. Record Initial Deposit Transaction if balance > 0 (Standardized to payments)
    if (parseFloat(balance) > 0) {
      console.log('[DEBUG] Creating initial deposit for member:', newMember.id, 'Amount:', balance);
      const initialTxnId = generateTransactionId('DEP');
      console.log('[DEBUG] Generated Transaction ID:', initialTxnId);
      
      await client.query(
        `INSERT INTO payments (member_id, amount, type, status, notes, transaction_id, created_at)
         VALUES ($1, $2, 'wallet_deposit', 'completed', 'Nạp tiền khởi tạo khi đăng ký tài khoản', $3, CURRENT_TIMESTAMP)`,
        [newMember.id, balance, initialTxnId]
      );
    }

    // Log Activity
    await logActivity(newMember.id, 'create_account', 'Đã tạo tài khoản hội viên mới.', req.ip, req.headers['user-agent'], client);

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Đã tạo Bạn đọc thành công',
      data: memberRows[0],
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Create Member Critical Error:', error);
    return res.status(error.message.includes('bắt buộc') || error.message.includes('đã được') ? 400 : 500).json({
      success: false,
      message: error.message || 'Lỗi máy chủ khi tạo Bạn đọc',
    });
  } finally {
    client.release();
  }
};

// PUT /api/admin/members/:id
exports.update = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const data = req.body;

    // Check if exists
    const { rows: existing } = await client.query('SELECT * FROM members WHERE id = $1', [id]);
    if (existing.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy Bạn đọc',
      });
    }

    const member = existing[0];

    // 1. Prepare Member update fields
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    const allowedFields = [
        'full_name', 'phone', 'address', 'card_number', 'identity_number',
        'membership_plan_id', 'date_of_birth', 'gender', 'status', 'balance',
        'membership_expires', 'card_type_id', 'issued_date', 'is_verified'
    ];

    allowedFields.forEach(key => {
      if (data[key] !== undefined) {
        let value = data[key];

        // Sanitize optional numeric/date fields
        if ((key === 'membership_plan_id' || key === 'card_type_id') && (value === '' || isNaN(parseInt(value)))) {
            value = null;
        } else if (key === 'membership_plan_id' || key === 'card_type_id') {
            value = parseInt(value);
        }

        if ((key === 'date_of_birth' || key === 'membership_expires' || key === 'issued_date') && value === '') {
            value = null;
        }

        updateFields.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    });

    if (updateFields.length > 0) {
      params.push(id);
      await client.query(
        `UPDATE members SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        params
      );
    }

    // 2. Synchronize with Users table if name or status changed
    if (member.user_id && (data.full_name || data.status)) {
        const userUpdateFields = [];
        const userParams = [];
        let userParamIndex = 1;

        if (data.full_name) {
            userUpdateFields.push(`name = $${userParamIndex++}`);
            userParams.push(data.full_name);
        }

        if (data.status) {
            userUpdateFields.push(`status = $${userParamIndex++}`);
            userParams.push(data.status === 'inactive' ? 'inactive' : 'active');
        }

        if (userUpdateFields.length > 0) {
            userParams.push(member.user_id);
            await client.query(
                `UPDATE users SET ${userUpdateFields.join(', ')} WHERE id = $${userParamIndex}`,
                userParams
            );
        }
    }

    // Log Activity
    await logActivity(id, 'update_account', 'Cập nhật thông tin hội viên.', req.ip, req.headers['user-agent'], client);

    await client.query('COMMIT');

    const { rows } = await client.query(`
      SELECT m.*, mp.name as membership_plan_name
      FROM members m
      LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
      WHERE m.id = $1
    `, [id]);

    return res.json({
      success: true,
      message: 'Cập nhật thông tin Bạn đọc thành công',
      data: rows[0],
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Update Member Error:', error);
    return res.status(error.code === '23505' ? 400 : 500).json({
      success: false,
      message: error.code === '23505' ? 'Dữ liệu bị trùng lặp (Email hoặc Mã thẻ)' : 'Lỗi máy chủ khi cập nhật Bạn đọc',
    });
  } finally {
    client.release();
  }
};

// DELETE /api/admin/members/:id
exports.remove = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const { rows } = await client.query('SELECT * FROM members WHERE id = $1', [id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy member',
      });
    }

    const member = rows[0];

    // Log BEFORE delete (so the record still exists for the FK)
    await logActivity(id, 'delete_account', 'Xóa tài khoản hội viên vĩnh viễn.', req.ip, req.headers['user-agent'], client);

    // 1. Delete membership requests associated with this member
    await client.query('DELETE FROM membership_requests WHERE member_id = $1', [id]);

    // 2. Delete member record
    await client.query('DELETE FROM members WHERE id = $1', [id]);

    // 3. Delete associated user account if exists
    if (member.user_id) {
        await client.query('DELETE FROM users WHERE id = $1', [member.user_id]);
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Đã xóa member thành công',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
};

exports.getStats = async (req, res) => {
  console.log('[DEBUG] Hit getStats');
  try {
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalResult = await pool.query('SELECT COUNT(*) FROM members');
    
    // Count VIP if plan name contains VIP OR price > 0
    const vipResult = await pool.query(`
      SELECT COUNT(*) FROM members m 
      LEFT JOIN membership_plans p ON m.membership_plan_id = p.id 
      WHERE p.name ILIKE '%VIP%' OR p.price > 0
    `);

    const inactiveResult = await pool.query(`
      SELECT COUNT(*) FROM members 
      WHERE last_activity_at < NOW() - INTERVAL '1 year' OR last_activity_at IS NULL
    `);

    const stats = {
      totalItems: parseInt(totalResult.rows[0].count),
      vipItems: parseInt(vipResult.rows[0].count),
      inactiveItems: parseInt(inactiveResult.rows[0].count),
      totalUsers: parseInt(usersResult.rows[0].count)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching member stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
const { processMembershipUpgrade } = require('../services/membership_upgrade.service');

// ... (existing code)

/**
 * Admin: Nâng cấp/Gia hạn VIP Hội viên thủ công (Thanh toán tại quầy)
 * POST /api/admin/members/:id/upgrade
 */
exports.manualUpgrade = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { planId, paymentMethod = 'cash', referenceId, notes, manual_days = 0 } = req.body;

    if (!planId) throw new Error('Vui lòng chọn gói hội viên');

    await client.query('BEGIN');

    // Use the shared service to process upgrade
    const result = await processMembershipUpgrade({
      memberId: id,
      planId: planId,
      manualDays: manual_days ? parseInt(manual_days) : 0,
      note: notes || `Admin nâng cấp thủ công (${paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'})`,
      paymentMethod: paymentMethod,
      paymentStatus: 'completed'
    }, client);

    // 5. Log activity
    await logActivity(id, 'manual_upgrade', `Đã nâng cấp VIP thủ công. Hạn mới: ${result.newExpires}`, req.ip, req.headers['user-agent'], client);

    await client.query('COMMIT');
    
    return res.json({
      success: true,
      message: `Nâng cấp thành công. Hạn mới mới: ${result.newExpires}`,
      data: result
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Manual Upgrade Error:', error);
    next(error);
  } finally {
    client.release();
  }
};

