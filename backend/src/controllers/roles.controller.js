const { pool } = require('../config/database');

const mapRole = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  description: row.description,
  isActive: row.is_active,
  isDefault: row.is_default,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapPermission = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  module: row.module,
  description: row.description,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// GET /api/admin/roles
exports.getRoles = async (req, res, next) => {
  try {
    const { active } = req.query;

    const conditions = [];
    const params = [];

    if (active !== undefined) {
      params.push(active === 'true');
      conditions.push(`is_active = $${params.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT id, code, name, description, is_active, is_default, created_at, updated_at
      FROM roles
      ${whereClause}
      ORDER BY id ASC
    `;

    const { rows } = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows.map(mapRole),
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/roles/:id
exports.getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT id, code, name, description, is_active, is_default, created_at, updated_at
      FROM roles
      WHERE id = $1
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    return res.json({
      success: true,
      data: mapRole(rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/admin/roles
exports.createRole = async (req, res, next) => {
  try {
    const { code, name, description, isActive = true, isDefault = false } =
      req.body || {};

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'code và name là bắt buộc',
      });
    }

    // Nếu isDefault = true, bỏ default của roles khác
    if (isDefault) {
      await pool.query('UPDATE roles SET is_default = FALSE WHERE is_default = TRUE');
    }

    const insertQuery = `
      INSERT INTO roles (code, name, description, is_active, is_default)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, code, name, description, is_active, is_default, created_at, updated_at
    `;

    const { rows } = await pool.query(insertQuery, [
      code,
      name,
      description || null,
      isActive,
      isDefault,
    ]);

    return res.status(201).json({
      success: true,
      data: mapRole(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Mã role (code) đã tồn tại',
      });
    }
    return next(error);
  }
};

// PUT /api/admin/roles/:id
exports.updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, description, isActive, isDefault } = req.body || {};

    const fields = [];
    const params = [];

    if (code !== undefined) {
      params.push(code);
      fields.push(`code = $${params.length}`);
    }
    if (name !== undefined) {
      params.push(name);
      fields.push(`name = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      fields.push(`description = $${params.length}`);
    }
    if (isActive !== undefined) {
      params.push(Boolean(isActive));
      fields.push(`is_active = $${params.length}`);
    }

    if (fields.length === 0 && isDefault === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
    }

    if (isDefault !== undefined && isDefault) {
      // bỏ default của role khác
      await pool.query(
        'UPDATE roles SET is_default = FALSE WHERE is_default = TRUE AND id <> $1',
        [id],
      );
      params.push(true);
      fields.push(`is_default = $${params.length}`);
    } else if (isDefault !== undefined && !isDefault) {
      params.push(false);
      fields.push(`is_default = $${params.length}`);
    }

    params.push(id);

    const updateQuery = `
      UPDATE roles
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING id, code, name, description, is_active, is_default, created_at, updated_at
    `;

    const { rows } = await pool.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    return res.json({
      success: true,
      data: mapRole(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Mã role (code) đã tồn tại',
      });
    }
    return next(error);
  }
};

// DELETE /api/admin/roles/:id
exports.deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra còn user đang dùng role này không
    const { rows: userRows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM users WHERE role_id = $1',
      [id],
    );

    if (userRows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xoá role vì đang được gán cho người dùng',
      });
    }

    const { rowCount } = await pool.query(
      `
      DELETE FROM roles
      WHERE id = $1
    `,
      [id],
    );

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    return res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/roles/:id/permissions
exports.getRolePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      rows: roleRows,
    } = await pool.query(
      'SELECT id, code, name, description, is_active, is_default, created_at, updated_at FROM roles WHERE id = $1',
      [id],
    );

    if (roleRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    const { rows: permissionRows } = await pool.query(
      `
      SELECT p.id,
             p.code,
             p.name,
             p.module,
             p.description,
             p.is_active,
             p.created_at,
             p.updated_at
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.module NULLS FIRST, p.code ASC
    `,
      [id],
    );

    return res.json({
      success: true,
      data: {
        role: mapRole(roleRows[0]),
        permissions: permissionRows.map(mapPermission),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/roles/:id/permissions
exports.updateRolePermissions = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { permissionIds } = req.body || {};

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: 'permissionIds phải là một mảng id quyền',
      });
    }

    // Kiểm tra role tồn tại
    const {
      rows: roleRows,
    } = await client.query(
      'SELECT id, code, name, description, is_active, is_default, created_at, updated_at FROM roles WHERE id = $1',
      [id],
    );

    if (roleRows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    await client.query('BEGIN');

    // Xoá toàn bộ mapping cũ
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);

    // Thêm mapping mới
    if (permissionIds.length > 0) {
      // Lọc trùng & chỉ giữ số
      const uniqueIds = Array.from(
        new Set(
          permissionIds
            .map((v) => Number(v))
            .filter((v) => Number.isInteger(v) && v > 0),
        ),
      );

      for (const pid of uniqueIds) {
        // ON CONFLICT để an toàn nếu unique không hoạt động như mong đợi
        // (dù trong schema đã có UNIQUE(role_id, permission_id))
        // eslint-disable-next-line no-await-in-loop
        await client.query(
          `
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `,
          [id, pid],
        );
      }
    }

    await client.query('COMMIT');

    // Lấy lại danh sách permissions mới
    const { rows: permissionRows } = await client.query(
      `
      SELECT p.id,
             p.code,
             p.name,
             p.module,
             p.description,
             p.is_active,
             p.created_at,
             p.updated_at
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.module NULLS FIRST, p.code ASC
    `,
      [id],
    );

    return res.json({
      success: true,
      data: {
        role: mapRole(roleRows[0]),
        permissions: permissionRows.map(mapPermission),
      },
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback error
    }
    return next(error);
  } finally {
    client.release();
  }
};

