const { pool } = require('../config/database');

// Helper function xử lý locale: lưu JSON string khi là object, giữ nguyên string
const processLocaleField = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') {
    if (value.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && (parsed.vi !== undefined || parsed.en !== undefined || parsed.ja !== undefined)) {
          return JSON.stringify(parsed);
        }
      } catch (e) {
        // ignore, return original
      }
    }
    return value;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (value.vi !== undefined || value.en !== undefined || value.ja !== undefined) {
      return JSON.stringify(value);
    }
  }
  return String(value);
};

// Helper parse locale field từ DB
const parseLocaleField = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    if (value.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && (parsed.vi !== undefined || parsed.en !== undefined || parsed.ja !== undefined)) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return value;
  }
  return value;
};

// GET /api/admin/testimonials
exports.getTestimonials = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM testimonials ORDER BY sort_order ASC, id ASC'
    );
    // Map snake_case to camelCase for frontend
    const mappedData = result.rows.map(row => ({
      id: row.id,
      quote: parseLocaleField(row.quote),
      author: parseLocaleField(row.author),
      company: parseLocaleField(row.company) || null,
      rating: row.rating,
      sortOrder: row.sort_order,
      isActive: row.is_active !== undefined ? row.is_active : true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    res.json({
      success: true,
      data: mappedData,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/testimonials/:id
exports.getTestimonialById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM testimonials WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
    }
    // Map snake_case to camelCase for frontend
    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        quote: parseLocaleField(row.quote),
        author: parseLocaleField(row.author),
        company: parseLocaleField(row.company) || null,
        rating: row.rating,
        sortOrder: row.sort_order,
        isActive: row.is_active !== undefined ? row.is_active : true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/testimonials
exports.createTestimonial = async (req, res, next) => {
  try {
    const { quote, author, company, rating, sortOrder, isActive } = req.body;

    const quoteStr = typeof quote === 'string' ? quote : (quote?.vi || quote?.en || quote?.ja || '');
    const authorStr = typeof author === 'string' ? author : (author?.vi || author?.en || author?.ja || '');

    if (!quoteStr || !quoteStr.trim() || !authorStr || !authorStr.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Quote và Author không được để trống',
      });
    }

    const result = await pool.query(
      `INSERT INTO testimonials (quote, author, company, rating, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
      [
        processLocaleField(quote),
        processLocaleField(author),
        company !== undefined ? processLocaleField(company) : null,
        rating || 5,
        sortOrder || 0,
        isActive !== undefined ? isActive : true,
      ]
    );

    // Map snake_case to camelCase for frontend
    const row = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        quote: parseLocaleField(row.quote),
        author: parseLocaleField(row.author),
        company: parseLocaleField(row.company) || null,
        rating: row.rating,
        sortOrder: row.sort_order,
        isActive: row.is_active !== undefined ? row.is_active : true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      message: 'Đã tạo đánh giá thành công',
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/testimonials/:id
exports.updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quote, author, company, rating, sortOrder, isActive } = req.body;

    const quoteStr = typeof quote === 'string' ? quote : (quote?.vi || quote?.en || quote?.ja || '');
    const authorStr = typeof author === 'string' ? author : (author?.vi || author?.en || author?.ja || '');

    if (!quoteStr || !quoteStr.trim() || !authorStr || !authorStr.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Quote và Author không được để trống',
      });
    }

    const result = await pool.query(
      `UPDATE testimonials
        SET quote = $1,
            author = $2,
            company = $3,
            rating = $4,
            sort_order = $5,
            is_active = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *`,
      [
        processLocaleField(quote),
        processLocaleField(author),
        company !== undefined ? processLocaleField(company) : null,
        rating || 5,
        sortOrder || 0,
        isActive !== undefined ? isActive : true,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
    }

    // Map snake_case to camelCase for frontend
    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        quote: parseLocaleField(row.quote),
        author: parseLocaleField(row.author),
        company: parseLocaleField(row.company) || null,
        rating: row.rating,
        sortOrder: row.sort_order,
        isActive: row.is_active !== undefined ? row.is_active : true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      message: 'Đã cập nhật đánh giá thành công',
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/testimonials/:id
exports.deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM testimonials WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
    }

    res.json({
      success: true,
      message: 'Đã xóa đánh giá thành công',
    });
  } catch (error) {
    next(error);
  }
};

