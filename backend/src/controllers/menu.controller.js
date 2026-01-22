const { pool } = require('../config/database');

// Helper function to parse locale field from JSON string
const parseLocaleField = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && ('vi' in parsed || 'en' in parsed || 'ja' in parsed)) {
        return parsed;
      }
    } catch (e) {
      // Not JSON, return as string
    }
    return value;
  }
  return value;
};

// Helper function to process locale field for database storage
const processLocaleField = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && ('vi' in value || 'en' in value || 'ja' in value)) {
    return JSON.stringify(value);
  }
  return typeof value === 'string' ? value : String(value);
};

// Chuẩn hóa dữ liệu menu trả về cho frontend
const mapMenu = (row) => ({
  id: row.id,
  title: parseLocaleField(row.title),
  url: row.url,
  parentId: row.parent_id,
  parentTitle: row.parent_title ? parseLocaleField(row.parent_title) : null,
  sortOrder: row.sort_order || 0,
  icon: row.icon || '',
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// GET /api/admin/menus
exports.getMenus = async (req, res, next) => {
  try {
    const { search, active } = req.query;

    const conditions = [];
    const params = [];

    if (typeof active !== 'undefined') {
      params.push(active === 'true');
      conditions.push(`m.is_active = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      // Search in both JSON locale fields and plain text
      conditions.push(
        `(LOWER(m.title::text) LIKE $${params.length} OR LOWER(m.url) LIKE $${params.length})`,
      );
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        m.id,
        m.title,
        m.url,
        m.parent_id,
        pm.title AS parent_title,
        m.sort_order,
        m.icon,
        m.is_active,
        m.created_at,
        m.updated_at
      FROM menus m
      LEFT JOIN menus pm ON m.parent_id = pm.id
      ${whereClause}
      ORDER BY COALESCE(m.parent_id, m.id), m.sort_order, m.id
    `;

    const { rows } = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows.map(mapMenu),
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/menus/:id
exports.getMenuById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
        SELECT
          m.id,
          m.title,
          m.url,
          m.parent_id,
          pm.title AS parent_title,
          m.sort_order,
          m.icon,
          m.is_active,
          m.created_at,
          m.updated_at
        FROM menus m
        LEFT JOIN menus pm ON m.parent_id = pm.id
        WHERE m.id = $1
        LIMIT 1
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy menu',
      });
    }

    return res.json({
      success: true,
      data: mapMenu(rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/admin/menus
exports.createMenu = async (req, res, next) => {
  try {
    const {
      title,
      url,
      parentId = null,
      sortOrder = 0,
      icon = '',
      isActive = true,
    } = req.body;

    // Validate title - can be string or locale object
    const titleValue = typeof title === 'object' && title !== null 
      ? (title.vi || title.en || title.ja || '')
      : (title || '');
    if (!titleValue.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề menu không được để trống',
      });
    }

    if (!url || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Đường dẫn (URL) không được để trống',
      });
    }

    const insertQuery = `
      INSERT INTO menus (
        title,
        url,
        parent_id,
        sort_order,
        icon,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const params = [
      processLocaleField(title),
      url.trim(),
      parentId || null,
      Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      icon || '',
      !!isActive,
    ];

    const { rows } = await pool.query(insertQuery, params);

    return res.status(201).json({
      success: true,
      data: mapMenu(rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/menus/:id
exports.updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      url,
      parentId,
      sortOrder,
      icon,
      isActive,
    } = req.body;

    const fields = [];
    const params = [];

    const addField = (column, value) => {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    };

    if (title !== undefined) addField('title', processLocaleField(title));
    if (url !== undefined) addField('url', url);
    if (parentId !== undefined) addField('parent_id', parentId || null);
    if (sortOrder !== undefined)
      addField(
        'sort_order',
        Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      );
    if (icon !== undefined) addField('icon', icon);
    if (isActive !== undefined) addField('is_active', !!isActive);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
    }

    params.push(id);

    const updateQuery = `
      UPDATE menus
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${params.length}
      RETURNING *
    `;

    const { rows } = await pool.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy menu',
      });
    }

    return res.json({
      success: true,
      data: mapMenu(rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/admin/menus/:id
exports.deleteMenu = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      'DELETE FROM menus WHERE id = $1',
      [id],
    );

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy menu',
      });
    }

    return res.json({
      success: true,
      message: 'Đã xóa menu',
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/public/menus - Public API để lấy menu cho frontend
exports.getPublicMenus = async (req, res, next) => {
  try {
    // Chỉ lấy menu active, sắp xếp theo parent_id và sort_order
    const query = `
      SELECT
        m.id,
        m.title,
        m.url,
        m.parent_id,
        m.sort_order,
        m.icon,
        m.is_active
      FROM menus m
      WHERE m.is_active = true
      ORDER BY COALESCE(m.parent_id, m.id), m.sort_order, m.id
    `;

    const { rows } = await pool.query(query);

    // Chuyển đổi flat list thành hierarchical structure
    const menuMap = new Map();
    const rootMenus = [];

    // Tạo map cho tất cả menu
    rows.forEach((row) => {
      menuMap.set(row.id, {
        id: row.id,
        title: parseLocaleField(row.title),
        url: row.url,
        parentId: row.parent_id,
        sortOrder: row.sort_order || 0,
        icon: row.icon || '',
        children: [],
      });
    });

    // Xây dựng cây menu
    rows.forEach((row) => {
      const menu = menuMap.get(row.id);
      if (row.parent_id) {
        const parent = menuMap.get(row.parent_id);
        if (parent) {
          parent.children.push(menu);
        } else {
          // Nếu parent không tồn tại hoặc không active, thêm vào root
          rootMenus.push(menu);
        }
      } else {
        // Menu không có parent, thêm vào root
        rootMenus.push(menu);
      }
    });

    // Sắp xếp children của mỗi menu
    menuMap.forEach((menu) => {
      if (menu.children && menu.children.length > 0) {
        menu.children.sort((a, b) => a.sortOrder - b.sortOrder);
      }
    });

    // Sắp xếp root menus
    rootMenus.sort((a, b) => a.sortOrder - b.sortOrder);


    return res.json({
      success: true,
      data: rootMenus,
    });
  } catch (error) {
    return next(error);
  }
};

