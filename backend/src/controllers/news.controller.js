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
    excerpt: parseLocaleField(row.excerpt),
    category: row.category || row.category_name || '',
    categoryId: row.category_id || row.category_code || '',
    categoryName: row.category_name || row.category || '',
    status: row.status,
    imageUrl: row.image_url || '',
    author: parseLocaleField(row.author),
    readTime: parseLocaleField(row.read_time),
    gradient: row.gradient || '',
    isFeatured: row.is_featured || false,
    link: row.slug || '',
    publishedDate: publishedDate || '',
    seoTitle: parseLocaleField(row.seo_title),
    seoDescription: parseLocaleField(row.seo_description),
    seoKeywords: parseLocaleField(row.seo_keywords),
    // Các cấu hình hiển thị chi tiết bài viết
    galleryTitle: parseLocaleField(row.gallery_title),
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
    showTableOfContents:
      row.show_table_of_contents !== false,
    enableShareButtons:
      row.enable_share_buttons !== false,
    showAuthorBox:
      row.show_author_box !== false,
    highlightFirstParagraph: undefined, // deprecated
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

    if (category) {
      params.push(category);
      conditions.push(`category_id = $${params.length}`);
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
        n.excerpt,
        n.content,
        n.category,
        n.category_id,
        c.name AS category_name,
        n.status,
        n.image_url,
        n.author,
        n.read_time,
        n.gradient,
        n.is_featured,
        n.gallery_title,
        n.gallery_images,
        n.gallery_position,
        n.show_table_of_contents,
        n.enable_share_buttons,
        n.show_author_box,
        n.highlight_first_paragraph,
        n.seo_title,
        n.seo_description,
        n.seo_keywords,
        TO_CHAR(n.published_date, 'YYYY-MM-DD') AS published_date,
        n.created_at,
        n.updated_at
      FROM news n
      LEFT JOIN news_categories c ON n.category_id = c.code
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
          n.excerpt,
          n.content,
          n.category,
          n.category_id,
          c.name AS category_name,
          n.status,
          n.image_url,
          n.author,
          n.read_time,
          n.gradient,
          n.is_featured,
          n.gallery_title,
          n.gallery_images,
          n.gallery_position,
          n.show_table_of_contents,
          n.enable_share_buttons,
          n.show_author_box,
          n.highlight_first_paragraph,
          n.seo_title,
          n.seo_description,
          n.seo_keywords,
          TO_CHAR(n.published_date, 'YYYY-MM-DD') AS published_date,
          n.created_at,
          n.updated_at
        FROM news n
        LEFT JOIN news_categories c ON n.category_id = c.code
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
      excerpt = '',
      category = '',
      categoryId = '',
      content = '',
      status = 'draft',
      imageUrl = '',
      author = '',
      readTime = '',
      gradient = '',
      link = '',
      publishedDate = new Date().toISOString().split('T')[0],
      seoTitle = '',
      seoDescription = '',
      seoKeywords = '',
      isFeatured = false,
      galleryTitle = '',
      // Các cấu hình hiển thị chi tiết bài viết
      galleryImages = [],
      galleryPosition = null,
      showTableOfContents = true,
      enableShareButtons = true,
      showAuthorBox = true,
      // highlightFirstParagraph deprecated, không dùng nữa
      highlightFirstParagraph = false,
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
        title, slug, excerpt, content, category, category_id,
        status, image_url, author, read_time, gradient, published_date,
        seo_title, seo_description, seo_keywords, is_featured,
        gallery_title, gallery_images, gallery_position, show_table_of_contents,
        enable_share_buttons, show_author_box, highlight_first_paragraph
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23
      )
      RETURNING 
        id, title, slug, excerpt, content, category, category_id,
        status, image_url, author, read_time, gradient, 
        gallery_title, gallery_images, gallery_position, show_table_of_contents,
        enable_share_buttons, show_author_box, highlight_first_paragraph,
        TO_CHAR(published_date, 'YYYY-MM-DD') AS published_date,
        seo_title, seo_description, seo_keywords, is_featured,
        created_at, updated_at
    `;

    const params = [
      processLocaleField(title),
      link,
      processLocaleField(excerpt),
      processLocaleField(content),
      category,
      categoryId,
      status,
      imageUrl,
      processLocaleField(author),
      processLocaleField(readTime),
      gradient,
      publishedDate,
      processLocaleField(seoTitle),
      processLocaleField(seoDescription),
      processLocaleField(seoKeywords),
      isFeatured,
      processLocaleField(galleryTitle),
      galleryImagesJson,
      galleryPositionNormalized,
      showTableOfContents,
      enableShareButtons,
      showAuthorBox,
      highlightFirstParagraph,
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
      excerpt,
      category,
      categoryId,
      content,
      status,
      imageUrl,
      author,
      readTime,
      gradient,
      link,
      publishedDate,
      seoTitle,
      seoDescription,
      seoKeywords,
      isFeatured,
      // Các cấu hình hiển thị chi tiết bài viết
      galleryImages,
      galleryPosition,
      showTableOfContents,
      enableShareButtons,
      showAuthorBox,
      galleryTitle,
      // highlightFirstParagraph (deprecated, không dùng nữa)
    } = req.body;

    const fields = [];
    const params = [];

    const addField = (column, value) => {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    };

    if (title !== undefined) addField('title', processLocaleField(title));
    if (link !== undefined) addField('slug', link);
    if (excerpt !== undefined) addField('excerpt', processLocaleField(excerpt));
    if (content !== undefined) addField('content', processLocaleField(content));
    if (category !== undefined) addField('category', category);
    if (categoryId !== undefined) addField('category_id', categoryId);
    if (status !== undefined) addField('status', status);
    if (imageUrl !== undefined) addField('image_url', imageUrl);
    if (author !== undefined) addField('author', processLocaleField(author));
    if (readTime !== undefined) addField('read_time', processLocaleField(readTime));
    if (gradient !== undefined) addField('gradient', gradient);
    if (seoTitle !== undefined) addField('seo_title', processLocaleField(seoTitle));
    if (seoDescription !== undefined) addField('seo_description', processLocaleField(seoDescription));
    if (seoKeywords !== undefined) addField('seo_keywords', processLocaleField(seoKeywords));
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
    if (galleryTitle !== undefined) addField('gallery_title', processLocaleField(galleryTitle));
    if (showTableOfContents !== undefined) addField('show_table_of_contents', showTableOfContents);
    if (enableShareButtons !== undefined) addField('enable_share_buttons', enableShareButtons);
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
        id, title, slug, excerpt, content, category, category_id,
        status, image_url, author, read_time, gradient, 
        gallery_title, gallery_images, gallery_position, show_table_of_contents,
        enable_share_buttons, show_author_box, highlight_first_paragraph,
        TO_CHAR(published_date, 'YYYY-MM-DD') AS published_date,
        seo_title, seo_description, seo_keywords, is_featured,
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

