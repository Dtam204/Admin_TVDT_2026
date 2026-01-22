const { pool } = require('../config/database');

// GET /api/admin/homepage/:sectionType
exports.getHomepageBlock = async (req, res, next) => {
  try {
    const { sectionType } = req.params;

    const { rows } = await pool.query(
      'SELECT * FROM homepage_blocks WHERE section_type = $1',
      [sectionType],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy khối ${sectionType}`,
      });
    }

    const row = rows[0];
    return res.json({
      success: true,
      data: {
        id: row.id,
        sectionType: row.section_type,
        data: row.data || {},
        isActive: row.is_active !== undefined ? row.is_active : true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/homepage
exports.getAllHomepageBlocks = async (req, res, next) => {
  try {
    const { active } = req.query;

    let query = `
      SELECT id, section_type, data, is_active, created_at, updated_at
      FROM homepage_blocks
    `;
    const params = [];

    if (active !== undefined) {
      params.push(active === 'true');
      query += ` WHERE is_active = $1`;
    }

    query += ` ORDER BY section_type ASC`;

    const { rows } = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows.map(row => ({
        id: row.id,
        sectionType: row.section_type,
        data: row.data || {},
        isActive: row.is_active !== undefined ? row.is_active : true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/homepage/:sectionType
exports.updateHomepageBlock = async (req, res, next) => {
  try {
    const { sectionType } = req.params;
    const { data, isActive = true } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data không được để trống',
      });
    }

    // Check if block exists
    const checkResult = await pool.query(
      'SELECT id FROM homepage_blocks WHERE section_type = $1',
      [sectionType],
    );

    let result;
    if (checkResult.rows.length === 0) {
      // Create new block
      result = await pool.query(
        `
          INSERT INTO homepage_blocks (section_type, data, is_active)
          VALUES ($1, $2, $3)
          RETURNING *
        `,
        [sectionType, JSON.stringify(data), isActive],
      );
    } else {
      // Update existing block
      result = await pool.query(
        `
          UPDATE homepage_blocks
          SET data = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
          WHERE section_type = $3
          RETURNING *
        `,
        [JSON.stringify(data), isActive, sectionType],
      );
    }

    const row = result.rows[0];
    return res.json({
      success: true,
      message: `Đã cập nhật khối ${sectionType} thành công`,
      data: {
        id: row.id,
        sectionType: row.section_type,
        data: row.data || {},
        isActive: row.is_active !== undefined ? row.is_active : true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

