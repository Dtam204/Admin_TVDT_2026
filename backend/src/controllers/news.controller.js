const { pool } = require('../config/database');
const AuditService = require('../services/admin/audit.service');

// Helper function để xử lý locale object: convert thành JSON string if needed (Focus: Vietnamese)
const processLocaleField = (value) => {
  if (value === undefined || value === null) return JSON.stringify({ vi: '' });
  const valStr = typeof value === 'string' ? value : (value.vi || value.en || '');
  return JSON.stringify({ vi: valStr });
};

// Helper function để parse locale field từ database
const parseLocaleField = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return value.vi || value.en || '';
  if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(value);
      return parsed.vi || parsed.en || '';
    } catch (e) { return value; }
  }
  return value;
};

// Chuẩn hóa dữ liệu trả về cho frontend
const mapNews = (row) => {
  let publishedDate = row.published_date || row.published_at; // Support both
  if (publishedDate instanceof Date) {
    const year = publishedDate.getFullYear();
    const month = String(publishedDate.getMonth() + 1).padStart(2, '0');
    const day = String(publishedDate.getDate()).padStart(2, '0');
    publishedDate = `${year}-${month}-${day}`;
  } else if (publishedDate && typeof publishedDate === 'string' && publishedDate.includes('T')) {
    publishedDate = publishedDate.split('T')[0];
  }

  // Format createdAt for frontend display
  let createdAt = row.created_at;
  if (createdAt instanceof Date) {
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const day = String(createdAt.getDate()).padStart(2, '0');
    const hours = String(createdAt.getHours()).padStart(2, '0');
    const minutes = String(createdAt.getMinutes()).padStart(2, '0');
    const seconds = String(createdAt.getSeconds()).padStart(2, '0');
    createdAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } else if (createdAt && typeof createdAt === 'string' && createdAt.includes('T')) {
    createdAt = createdAt.replace('T', ' ').split('.')[0];
  }
  
  return {
    ...row,
    id: parseInt(row.id),
    title: parseLocaleField(row.title),
    excerpt: parseLocaleField(row.summary),
    author: parseLocaleField(row.author),
    readTime: parseLocaleField(row.read_time),
    content: parseLocaleField(row.content),
    publishedDate: publishedDate || '',
    createdAt: createdAt || '',
    isFeatured: !!row.is_featured,
    commentsCount: parseInt(row.comments_count || 0),
    imageUrl: row.image_url || '',
    galleryImages: (() => {
      if (!row.gallery_images) return [];
      if (Array.isArray(row.gallery_images)) return row.gallery_images;
      try { return JSON.parse(row.gallery_images); } catch (e) { return []; }
    })(),
  };
};

/**
 * News Controller - CHUẨN HÓA RESTFUL (Admin)
 */

// GET /api/admin/news
exports.getNews = async (req, res, next) => {
  try {
    const { status, search, featured } = req.query;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`LOWER(title::text) LIKE $${params.length}`);
    }

    if (featured === 'true') {
      conditions.push('n.is_featured = true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT n.*, (SELECT COUNT(*) FROM comments WHERE object_id = n.id AND object_type = 'news' AND status != 'deleted') as comments_count
      FROM news n
      ${whereClause}
      ORDER BY n.id DESC
    `;

    const { rows } = await pool.query(query, params);
    return res.json({ 
      success: true, 
      message: "Lấy danh sách bài viết thành công",
      data: rows.map(mapNews),
      code: 0 
    });
  } catch (error) { return next(error); }
};

// GET /api/admin/news/:id
exports.getNewsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy bài viết trên hệ thống', 
        code: 404 
      });
    }
    return res.json({ 
      success: true, 
      message: "Lấy chi tiết bài viết thành công",
      data: mapNews(rows[0]),
      code: 0 
    });
  } catch (error) { return next(error); }
};

// POST /api/admin/news
exports.createNews = async (req, res, next) => {
  try {
    const adminId = req.user?.id || null;
    const {
      title, summary, excerpt, content = '', status = 'draft', imageUrl, image_url,
      author = '', readTime = '', slug = '',
      publishedDate = new Date().toISOString().split('T')[0],
      isFeatured = false, galleryImages = [], galleryPosition = null, showAuthorBox = true
    } = req.body;

    const finalSummary = summary ?? excerpt ?? '';
    const finalImageUrl = imageUrl ?? image_url ?? '';

    const insertQuery = `
      INSERT INTO news (
        title, slug, summary, content, status, image_url, author, 
        read_time, published_date, is_featured, gallery_images, 
        gallery_position, show_author_box
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const params = [
      processLocaleField(title), slug, processLocaleField(finalSummary),
      processLocaleField(content), status, finalImageUrl, processLocaleField(author),
      processLocaleField(readTime), publishedDate, isFeatured, 
      JSON.stringify(galleryImages), galleryPosition, showAuthorBox
    ];

    const { rows } = await pool.query(insertQuery, params);
    const newNews = rows[0];

    if (adminId) {
      await AuditService.log(adminId, 'CREATE', 'NEWS', newNews.id, null, newNews);
    }

    return res.status(201).json({ 
      success: true, 
      message: "Bài viết mới đã được khởi tạo thành công",
      data: mapNews(newNews),
      code: 0 
    });
  } catch (error) { return next(error); }
};

// PUT /api/admin/news/:id
exports.updateNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || null;
    const { rows: existing } = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy bài viết để cập nhật', 
        code: 404 
      });
    }
    const oldNews = existing[0];

    const data = {
      ...req.body,
      image_url: req.body.image_url ?? req.body.imageUrl,
      summary: req.body.summary ?? req.body.excerpt,
      published_date: req.body.published_date ?? req.body.publishedDate,
      is_featured: req.body.is_featured ?? req.body.isFeatured,
      gallery_position: req.body.gallery_position ?? req.body.galleryPosition,
      show_author_box: req.body.show_author_box ?? req.body.showAuthorBox,
      read_time: req.body.read_time ?? req.body.readTime,
    };
    const fields = [];
    const params = [];

    const updateFields = [
      'slug', 'status', 'image_url', 'published_date', 'is_featured', 
      'gallery_position', 'show_author_box'
    ];
    updateFields.forEach(f => {
      if (data[f] !== undefined) {
        params.push(data[f]);
        fields.push(`${f} = $${params.length}`);
      }
    });

    if (data.title !== undefined) { params.push(processLocaleField(data.title)); fields.push(`title = $${params.length}`); }
    if (data.summary !== undefined) { params.push(processLocaleField(data.summary)); fields.push(`summary = $${params.length}`); }
    if (data.content !== undefined) { params.push(processLocaleField(data.content)); fields.push(`content = $${params.length}`); }
    if (data.author !== undefined) { params.push(processLocaleField(data.author)); fields.push(`author = $${params.length}`); }
    if (data.read_time !== undefined) { params.push(processLocaleField(data.read_time)); fields.push(`read_time = $${params.length}`); }
    if (data.galleryImages !== undefined) { params.push(JSON.stringify(data.galleryImages)); fields.push(`gallery_images = $${params.length}`); }

    if (fields.length === 0) return res.json({ success: true, data: mapNews(oldNews), code: 0 });

    params.push(id);
    const query = `UPDATE news SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING *`;
    const { rows } = await pool.query(query, params);
    const updatedNews = rows[0];

    if (adminId) {
      await AuditService.log(adminId, 'UPDATE', 'NEWS', id, oldNews, updatedNews);
    }

    return res.json({ 
      success: true, 
      message: "Nội dung bài viết đã được cập nhật",
      data: mapNews(updatedNews),
      code: 0 
    });
  } catch (error) { return next(error); }
};

// DELETE /api/admin/news/:id - CHUẨN 204 NO CONTENT
exports.deleteNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id || null;
    const { rows: existing } = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy bài viết để xóa', 
        code: 404 
      });
    }
    
    const { rowCount } = await pool.query('DELETE FROM news WHERE id = $1', [id]);
    if (rowCount > 0 && adminId) {
      await AuditService.log(adminId, 'DELETE', 'NEWS', id, existing[0], null);
    }
    
    // REST Standard: 204 No Content for successful deletion
    return res.status(204).send();
  } catch (error) { return next(error); }
};

// PATCH /api/admin/news/:id/status
exports.updateNewsStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái bài viết không hợp lệ', code: 400 });
    }

    const { rows } = await pool.query(
      'UPDATE news SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status',
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết', code: 404 });
    }

    return res.json({ success: true, message: "Trạng thái đã được cập nhật thành công", data: rows[0], code: 0 });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/admin/news/:id/featured
exports.toggleNewsFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    const { rows } = await pool.query(
      'UPDATE news SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, is_featured',
      [isFeatured, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết', code: 404 });
    }

    return res.json({ 
      success: true, 
      message: isFeatured ? "Đã bật trạng thái bài viết nổi bật" : "Đã tắt trạng thái bài viết nổi bật",
      data: rows[0], 
      code: 0 
    });
  } catch (error) {
    return next(error);
  }
};
