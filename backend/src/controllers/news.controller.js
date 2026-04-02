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

// Chuẩn hóa dữ liệu trả về cho frontend
const mapNews = (row) => {
  // Format published_date để tránh timezone issues
  // Nếu là Date object, format thành YYYY-MM-DD
  // Nếu đã là string YYYY-MM-DD, giữ nguyên
  let publishedDate = row.published_date;
  if (publishedDate instanceof Date) {
    // Nếu là Date object, format thành YYYY-MM-DD
    const year = publishedDate.getFullYear();
    const month = String(publishedDate.getMonth() + 1).padStart(2, '0');
    const day = String(publishedDate.getDate()).padStart(2, '0');
    publishedDate = `${year}-${month}-${day}`;
  } else if (publishedDate && typeof publishedDate === 'string' && publishedDate.includes('T')) {
    // Nếu là ISO string, chỉ lấy phần date
    publishedDate = publishedDate.split('T')[0];
  }
  
  return {
    id: row.id,
    title: parseLocaleField(row.title),
    excerpt: parseLocaleField(row.summary),
    status: row.status,
    imageUrl: row.image_url || '',
    author: parseLocaleField(row.author),
    readTime: parseLocaleField(row.read_time),
    isFeatured: row.is_featured || false,
    slug: row.slug || '',
    publishedDate: publishedDate || '',
    // Các cấu hình hiển thị chi tiết bài viết
    content: parseLocaleField(row.content),
    galleryImages: (() => {
      if (!row.gallery_images) return [];
      if (Array.isArray(row.gallery_images)) return row.gallery_images;
      try {
        const parsed = JSON.parse(row.gallery_images);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    })(),
    galleryPosition: row.gallery_position || null,
    showAuthorBox:
      row.show_author_box !== false,
    commentsCount: parseInt(row.comments_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// GET /api/admin/news
exports.getNews = async (req, res, next) => {
  try {
    const { status, category, search, featured } = req.query;

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }


    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`LOWER(title) LIKE $${params.length}`);
    }

    if (featured === 'true') {
      conditions.push('n.is_featured = true');
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        n.id,
        n.title,
        n.slug,
        n.summary,
        n.content,
        n.status,
        n.image_url,
        n.author,
        n.read_time,
        n.is_featured,
        n.gallery_images,
        n.gallery_position,
        n.show_author_box,
        TO_CHAR(n.published_date, 'YYYY-MM-DD') AS published_date,
        n.created_at,
        n.updated_at,
        (SELECT COUNT(*) FROM comments WHERE object_id = n.id AND object_type = 'news' AND status != 'deleted') as comments_count
      FROM news n
      ${whereClause}
      ORDER BY n.id DESC
    `;

    const { rows } = await pool.query(query, params);

    return res.json({
      success: true,
      data: rows.map(mapNews),
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/admin/news/:id
exports.getNewsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
        SELECT
          n.id,
          n.title,
          n.slug,
          n.summary,
          n.content,
          n.status,
          n.image_url,
          n.author,
          n.read_time,
          n.is_featured,
          n.gallery_images,
          n.gallery_position,
          n.show_author_box,
          TO_CHAR(n.published_date, 'YYYY-MM-DD') AS published_date,
          n.created_at,
          n.updated_at,
          (SELECT COUNT(*) FROM comments WHERE object_id = n.id AND object_type = 'news' AND status != 'deleted') as comments_count
        FROM news n
        WHERE n.id = $1
        LIMIT 1
      `,
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết',
      });
    }

    return res.json({
      success: true,
      data: mapNews(rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/admin/news
exports.createNews = async (req, res, next) => {
  try {
    const {
      title,
      summary,
      excerpt,
      content = '',
      status = 'draft',
      imageUrl = '',
      author = '',
      readTime = '',
      slug = '',
      publishedDate = new Date().toISOString().split('T')[0],
      isFeatured = false,
      galleryImages = [],
      galleryPosition = null,
      showAuthorBox = true,
    } = req.body;

    // Validate title: có thể là string hoặc locale object
    const titleText = typeof title === 'string' ? title : (title?.vi || title?.en || title?.ja || '');
    if (!titleText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề không được để trống',
      });
    }

    // Chuẩn hóa gallery_images thành JSON string để lưu vào JSONB
    const galleryImagesJson =
      Array.isArray(galleryImages) ? JSON.stringify(galleryImages) : galleryImages;
    const galleryPositionNormalized =
      galleryPosition === 'top' ? 'top' : galleryPosition === 'bottom' ? 'bottom' : null;

    const insertQuery = `
      INSERT INTO news (
        title, slug, summary, content,
        status, image_url, author, read_time, published_date,
        is_featured, gallery_images, gallery_position, show_author_box
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING 
        id, title, slug, summary, content,
        status, image_url, author, read_time, 
        gallery_images, gallery_position, show_author_box, 
        TO_CHAR(published_date, 'YYYY-MM-DD') AS published_date,
        is_featured,
        created_at, updated_at
    `;

    const params = [
      processLocaleField(title),
      slug,
      processLocaleField(summary || excerpt || ''),
      processLocaleField(content),
      status,
      imageUrl,
      processLocaleField(author),
      processLocaleField(readTime),
      publishedDate,
      isFeatured,
      galleryImagesJson,
      galleryPositionNormalized,
      showAuthorBox
    ];

    const { rows } = await pool.query(insertQuery, params);

    return res.status(201).json({
      success: true,
      data: mapNews(rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/admin/news/:id
exports.updateNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      summary,
      excerpt,
      content,
      status,
      imageUrl,
      author,
      readTime,
      slug,
      publishedDate,
      isFeatured,
      galleryImages,
      galleryPosition,
      showAuthorBox,
    } = req.body;

    const fields = [];
    const params = [];

    const addField = (column, value) => {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    };

    if (title !== undefined) addField('title', processLocaleField(title));
    if (slug !== undefined) addField('slug', slug);
    if (summary !== undefined || excerpt !== undefined) addField('summary', processLocaleField(summary || excerpt));

    if (content !== undefined) addField('content', processLocaleField(content));
    if (status !== undefined) addField('status', status);
    if (imageUrl !== undefined) addField('image_url', imageUrl);
    if (author !== undefined) addField('author', processLocaleField(author));
    if (readTime !== undefined) addField('read_time', processLocaleField(readTime));
    if (publishedDate !== undefined) addField('published_date', publishedDate);
    if (isFeatured !== undefined) addField('is_featured', isFeatured);
    if (galleryImages !== undefined) {
      const galleryImagesJson =
        Array.isArray(galleryImages) ? JSON.stringify(galleryImages) : galleryImages;
      addField('gallery_images', galleryImagesJson);
    }
    if (galleryPosition !== undefined) {
      const galleryPositionNormalized =
        galleryPosition === 'top' ? 'top' : galleryPosition === 'bottom' ? 'bottom' : 'top';
      addField('gallery_position', galleryPositionNormalized);
    }
    if (showAuthorBox !== undefined) addField('show_author_box', showAuthorBox);
    // highlight_first_paragraph deprecated - bỏ qua nếu gửi lên

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
      });
    }

    params.push(id);

     const updateQuery = `
      UPDATE news
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${params.length}
      RETURNING 
        id, title, slug, summary, content,
        status, image_url, author, read_time, 
        gallery_images, gallery_position, show_author_box, 
        TO_CHAR(published_date, 'YYYY-MM-DD') AS published_date,
        is_featured,
        created_at, updated_at
    `;

    const { rows } = await pool.query(updateQuery, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết',
      });
    }

    return res.json({
      success: true,
      data: mapNews(rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/admin/news/:id
exports.deleteNews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query('DELETE FROM news WHERE id = $1', [
      id,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết',
      });
    }

    return res.json({
      success: true,
      message: 'Đã xóa bài viết',
    });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/admin/news/:id/status
exports.updateNewsStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const { rows } = await pool.query(
      'UPDATE news SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status',
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    return res.json({ success: true, data: rows[0] });
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
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return next(error);
  }
};

