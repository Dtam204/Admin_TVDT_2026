const { pool } = require('../config/database');

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

// GET /api/admin/permissions
exports.getPermissions = async (req, res, next) => {
  try {
    const { module, active, search } = req.query;

    const conditions = [];
    const params = [];

    if (module) {
      params.push(module);
      conditions.push(`module = $${params.length}`);
    }

    if (active !== undefined) {
      params.push(active === 'true');
      conditions.push(`is_active = $${params.length}`);
    }

    if (search) {
      const q = `%${search.toLowerCase()}%`;
      params.push(q);
      conditions.push(`(LOWER(code) LIKE $${params.length} OR LOWER(name) LIKE $${params.length})`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT id, code, name, module, description, is_active, created_at, updated_at
      FROM permissions
      ${whereClause}
      ORDER BY module NULLS FIRST, code ASC
    `;

    const { rows } = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows.map(mapPermission),
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/permissions/:id
exports.getPermissionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT id, code, name, module, description, is_active, created_at, updated_at
      FROM permissions
      WHERE id = $1
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found',
      });
    }

    return res.json({
      success: true,
      data: mapPermission(rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/admin/permissions
exports.createPermission = async (req, res, next) => {
  try {
    const { code, name, module, description, isActive = true } = req.body || {};

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'code và name là bắt buộc',
      });
    }

    const insertQuery = `
      INSERT INTO permissions (code, name, module, description, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, code, name, module, description, is_active, created_at, updated_at
    `;

    const { rows } = await pool.query(insertQuery, [
      code,
      name,
      module || null,
      description || null,
      isActive,
    ]);

    return res.status(201).json({
      success: true,
      data: mapPermission(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Mã quyền (code) đã tồn tại',
      });
    }
    return next(error);
  }
};

// PUT /api/admin/permissions/:id
exports.updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, module, description, isActive } = req.body || {};

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
    if (module !== undefined) {
      params.push(module);
      fields.push(`module = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      fields.push(`description = $${params.length}`);
    }
    if (isActive !== undefined) {
      params.push(Boolean(isActive));
      fields.push(`is_active = $${params.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
    }

    params.push(id);

    const updateQuery = `
      UPDATE permissions
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING id, code, name, module, description, is_active, created_at, updated_at
    `;

    const { rows } = await pool.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found',
      });
    }

    return res.json({
      success: true,
      data: mapPermission(rows[0]),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Mã quyền (code) đã tồn tại',
      });
    }
    return next(error);
  }
};

// DELETE /api/admin/permissions/:id
exports.deletePermission = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `
      DELETE FROM permissions
      WHERE id = $1
    `,
      [id],
    );

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found',
      });
    }

    return res.json({
      success: true,
      message: 'Permission deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
};


