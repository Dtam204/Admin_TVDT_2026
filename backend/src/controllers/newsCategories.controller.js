const { pool } = require('../config/database');

// Helper function để xử lý locale object: convert thành JSON string nếu là object, giữ nguyên nếu là string
const processLocaleField = (value) => {
  if (value === undefined || value === null) return '';
  
  if (typeof value === 'string') {
    // Nếu là JSON string (bắt đầu bằng {), parse và stringify lại để đảm bảo format đúng
    if (value.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && (parsed.vi !== undefined || parsed.en !== undefined || parsed.ja !== undefined)) {
          return JSON.stringify(parsed);
        }
      } catch (e) {
        // Không phải JSON hợp lệ, trả về string gốc
      }
    }
    return value;
  }
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    // Kiểm tra xem có phải locale object không
    if (value.vi !== undefined || value.en !== undefined || value.ja !== undefined) {
      return JSON.stringify(value);
    }
  }
  
  return String(value);
};

// Helper function để parse locale field từ database: nếu là JSON string thì parse, nếu không thì trả về string
const parseLocaleField = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    // Thử parse JSON
    if (value.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && (parsed.vi !== undefined || parsed.en !== undefined || parsed.ja !== undefined)) {
          return parsed;
        }
      } catch (e) {
        // Không phải JSON hợp lệ, trả về string gốc
      }
    }
    return value;
  }
  return value;
};

const mapCategory = (row) => ({
  code: row.code,
  name: parseLocaleField(row.name),
  description: parseLocaleField(row.description) || '',
  isActive: row.is_active,
  parentCode: row.parent_code || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// GET /api/admin/categories
exports.getCategories = async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT code, name, description, parent_code, is_active, created_at, updated_at
       FROM news_categories
       ORDER BY name ASC`,
    );
    return res.json({ success: true, data: rows.map(mapCategory) });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/categories/:code
exports.getCategoryByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { rows } = await pool.query(
      `SELECT code, name, description, parent_code, is_active, created_at, updated_at
       FROM news_categories
       WHERE code = $1
       LIMIT 1`,
      [code],
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    return res.json({ success: true, data: mapCategory(rows[0]) });
  } catch (error) {
    return next(error);
  }
};

// POST /api/admin/categories
exports.createCategory = async (req, res, next) => {
  try {
    const { code, name, description = '', isActive = true, parentCode = null } = req.body;
    
    // Validate: kiểm tra name có giá trị không (có thể là string hoặc locale object)
    const nameValue = typeof name === 'string' ? name : (name?.vi || name?.en || name?.ja || '');
    if (!code || !nameValue.trim()) {
      return res.status(400).json({ success: false, message: 'code và name là bắt buộc' });
    }

    const normalizedParent = parentCode || null;
    const processedName = processLocaleField(name);
    const processedDescription = processLocaleField(description);

    const { rows } = await pool.query(
      `INSERT INTO news_categories (code, name, description, parent_code, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING code, name, description, parent_code, is_active, created_at, updated_at`,
      [code, processedName, processedDescription, normalizedParent, isActive],
    );

    return res.status(201).json({ success: true, data: mapCategory(rows[0]) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Mã code đã tồn tại' });
    }
    return next(error);
  }
};

// PUT /api/admin/categories/:code
exports.updateCategory = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description, isActive, parentCode } = req.body;

    const fields = [];
    const params = [];

    const addField = (column, value) => {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    };

    if (name !== undefined) {
      const processedName = processLocaleField(name);
      addField('name', processedName);
    }
    if (description !== undefined) {
      const processedDescription = processLocaleField(description);
      addField('description', processedDescription);
    }
    if (isActive !== undefined) addField('is_active', isActive);
    if (parentCode !== undefined) addField('parent_code', parentCode || null);

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu để cập nhật' });
    }

    params.push(code);

    const { rows } = await pool.query(
      `UPDATE news_categories
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE code = $${params.length}
       RETURNING code, name, description, parent_code, is_active, created_at, updated_at`,
      params,
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    return res.json({ success: true, data: mapCategory(rows[0]) });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/admin/categories/:code
exports.deleteCategory = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { rowCount } = await pool.query(
      `DELETE FROM news_categories WHERE code = $1`,
      [code],
    );

    if (!rowCount) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    return res.json({ success: true, message: 'Đã xóa danh mục' });
  } catch (error) {
    return next(error);
  }
};
