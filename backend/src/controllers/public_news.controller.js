const { pool } = require('../config/database');
const { sendApiResponse } = require('../utils/apiResponse');

// Helper function để parse locale field
const parseLocaleField = (value, locale = 'vi') => {
  if (!value) return '';
  if (typeof value === 'object') {
    return value[locale] || value.vi || value.en || '';
  }
  if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(value);
      return parsed[locale] || parsed.vi || parsed.en || '';
    } catch (e) {
      return value;
    }
  }
  return value;
};

// GET /api/public/news
exports.getPublicNews = async (req, res, next) => {
  try {
    const { search, locale = 'vi' } = req.query;
    const params = [];
    let query = `
      SELECT n.id, n.title, n.slug, n.summary, n.thumbnail, n.image_url, n.author,
             n.published_date, n.is_featured, n.read_time
      FROM news n
      WHERE n.status = 'published'
    `;

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(n.title::text) LIKE $${params.length} OR LOWER(n.summary::text) LIKE $${params.length})`;
    }

    query += ` ORDER BY n.published_date DESC, n.id DESC`;

    const { rows } = await pool.query(query, params);
    
    const data = rows.map(row => ({
      ...row,
      title: parseLocaleField(row.title, locale),
      summary: parseLocaleField(row.summary, locale),
      excerpt: parseLocaleField(row.summary, locale),
      author: parseLocaleField(row.author, locale),
      thumbnail: row.thumbnail || '',
      imageUrl: row.image_url || ''
    }));

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Lấy danh sách tin tức thành công',
      data,
      errors: null,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/public/news/:slug
exports.getPublicNewsDetail = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { locale = 'vi' } = req.query;

    const { rows } = await pool.query(
      `SELECT n.*
       FROM news n
       WHERE n.slug = $1 AND n.status = 'published'`,
      [slug]
    );

    if (rows.length === 0) {
      return sendApiResponse(res, {
        status: 404,
        success: false,
        message: 'Không tìm thấy bài viết',
        data: null,
        errors: ['NEWS_NOT_FOUND'],
      });
    }

    const row = rows[0];
    const data = {
      ...row,
      title: parseLocaleField(row.title, locale),
      content: parseLocaleField(row.content, locale),
      summary: parseLocaleField(row.summary, locale),
      excerpt: parseLocaleField(row.summary, locale),
      author: parseLocaleField(row.author, locale),
      thumbnail: row.thumbnail || '',
      imageUrl: row.image_url || '',
      galleryTitle: parseLocaleField(row.gallery_title, locale),
      seoTitle: parseLocaleField(row.seo_title, locale),
      seoDescription: parseLocaleField(row.seo_description, locale),
      seoKeywords: parseLocaleField(row.seo_keywords, locale),
      galleryImages: (() => {
        if (!row.gallery_images) return [];
        if (Array.isArray(row.gallery_images)) return row.gallery_images;
        try { return JSON.parse(row.gallery_images); } catch (e) { return []; }
      })()
    };

    return sendApiResponse(res, {
      status: 200,
      success: true,
      message: 'Lấy chi tiết tin tức thành công',
      data,
      errors: null,
    });
  } catch (error) {
    return next(error);
  }
};
