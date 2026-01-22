const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

// Helper to map DB row to API shape (ẩn password, chuẩn hoá role)
const mapUser = (row) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  roleId: row.role_id,
  roleCode: row.role_code,
  roleName: row.role_name,
  // để tương thích với frontend cũ, giữ thêm field role = roleCode
  role: row.role_code,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { status, role, search } = req.query;

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (role) {
      // lọc theo role code
      params.push(role);
      conditions.push(`r.code = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`LOWER(name) LIKE $${params.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        u.id,
        u.email,
        u.name,
        u.role_id,
        r.code AS role_code,
        r.name AS role_name,
        u.status,
        u.created_at,
        u.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.id DESC
    `;

    const { rows } = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows.map(mapUser),
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.name,
        u.role_id,
        r.code AS role_code,
        r.name AS role_name,
        u.status,
        u.created_at,
        u.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: mapUser(rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/admin/users
exports.createUser = async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      roleId,
      roleCode,
      status = 'active',
    } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'email, password và name là bắt buộc',
      });
    }

    // Xác định role_id: ưu tiên roleId, sau đó roleCode, cuối cùng default role (is_default = true)
    let resolvedRoleId = roleId || null;

    if (!resolvedRoleId) {
      let roleQuery = 'SELECT id FROM roles WHERE code = $1 LIMIT 1';
      let roleParams = [];

      if (roleCode) {
        roleParams = [roleCode];
      } else {
        // dùng role mặc định
        roleQuery =
          'SELECT id FROM roles WHERE is_default = TRUE AND is_active = TRUE LIMIT 1';
      }

      const { rows: roleRows } = await pool.query(roleQuery, roleParams);
      if (roleRows.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            'Không tìm thấy role phù hợp (roleId/roleCode hoặc role mặc định). Vui lòng tạo roles trước.',
        });
      }
      resolvedRoleId = roleRows[0].id;
    }

    // Hash password trước khi lưu vào DB
    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (email, password, name, role_id, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        email,
        name,
        role_id,
        status,
        created_at,
        updated_at
    `;

    const { rows } = await pool.query(insertQuery, [
      email,
      hashedPassword,
      name,
      resolvedRoleId,
      status,
    ]);

    // Lấy thêm thông tin role để trả về đủ mapUser
    const { rows: fullRows } = await pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.name,
        u.role_id,
        r.code AS role_code,
        r.name AS role_name,
        u.status,
        u.created_at,
        u.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `,
      [rows[0].id],
    );

    return res.status(201).json({
      success: true,
      data: mapUser(fullRows[0]),
    });
  } catch (error) {
    // Handle unique email violation
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email đã tồn tại',
      });
    }

    return next(error);
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, password, name, roleId, roleCode, status } = req.body || {};

    // Build dynamic update set
    const fields = [];
    const params = [];

    if (email !== undefined) {
      params.push(email);
      fields.push(`email = $${params.length}`);
    }
    if (password !== undefined && password !== null && password !== '') {
      // Hash password trước khi cập nhật
      const hashedPassword = await bcrypt.hash(password, 10);
      params.push(hashedPassword);
      fields.push(`password = $${params.length}`);
    }
    if (name !== undefined) {
      params.push(name);
      fields.push(`name = $${params.length}`);
    }
    // xử lý roleId / roleCode
    if (roleId !== undefined || roleCode !== undefined) {
      let resolvedRoleId = roleId || null;

      if (!resolvedRoleId && roleCode) {
        const { rows: roleRows } = await pool.query(
          'SELECT id FROM roles WHERE code = $1 LIMIT 1',
          [roleCode],
        );
        if (roleRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'roleCode không hợp lệ',
          });
        }
        resolvedRoleId = roleRows[0].id;
      }

      if (resolvedRoleId) {
        params.push(resolvedRoleId);
        fields.push(`role_id = $${params.length}`);
      }
    }
    if (status !== undefined) {
      params.push(status);
      fields.push(`status = $${params.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
    }

    params.push(id);

    const updateQuery = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING id
    `;

    const { rows } = await pool.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Lấy lại user đầy đủ sau khi update
    const { rows: fullRows } = await pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.name,
        u.role_id,
        r.code AS role_code,
        r.name AS role_name,
        u.status,
        u.created_at,
        u.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `,
      [rows[0].id],
    );

    return res.json({
      success: true,
      data: mapUser(fullRows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Email đã tồn tại',
      });
    }

    return next(error);
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
    `,
      [id],
    );

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
};


