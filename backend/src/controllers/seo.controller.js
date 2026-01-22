const { pool } = require('../config/database');
const { getLocaleFromRequest } = require('../utils/locale');

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

// Helper function to map SEO row data
const mapSeoPage = (row) => ({
  id: row.id,
  page_path: row.page_path,
  page_type: row.page_type,
  title: parseLocaleField(row.title),
  description: parseLocaleField(row.description),
  keywords: parseLocaleField(row.keywords),
  image: row.image,
  og_title: parseLocaleField(row.og_title),
  og_description: parseLocaleField(row.og_description),
  og_image: row.og_image,
  og_type: row.og_type,
  twitter_card: row.twitter_card,
  twitter_title: parseLocaleField(row.twitter_title),
  twitter_description: parseLocaleField(row.twitter_description),
  twitter_image: row.twitter_image,
  canonical_url: row.canonical_url,
  robots_index: row.robots_index,
  robots_follow: row.robots_follow,
  robots_noarchive: row.robots_noarchive,
  robots_nosnippet: row.robots_nosnippet,
  structured_data: row.structured_data,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

/**
 * Lấy tất cả các trang SEO (admin)
 */
async function getSeoPages(req, res) {
  try {
    const result = await pool.query(
      `SELECT * FROM seo_pages ORDER BY page_path ASC`
    );

    return res.status(200).json({
      success: true,
      data: result.rows.map(mapSeoPage),
    });
  } catch (error) {
    console.error('Error fetching SEO pages:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách trang SEO',
      error: error.message,
    });
  }
}

/**
 * Lấy SEO theo page path (admin)
 */
async function getSeoPageByPath(req, res) {
  try {
    let { path } = req.params;
    
    // Nếu path không có, dùng '/'
    if (!path || path === '') {
      path = '/';
    }
    
    // Decode path
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(path);
    } catch (e) {
      decodedPath = path;
    }

    const result = await pool.query(
      `SELECT * FROM seo_pages WHERE page_path = $1`,
      [decodedPath]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cấu hình SEO cho trang này',
      });
    }

    return res.status(200).json({
      success: true,
      data: mapSeoPage(result.rows[0]),
    });
  } catch (error) {
    console.error('Error fetching SEO page:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cấu hình SEO',
      error: error.message,
    });
  }
}

/**
 * Cập nhật hoặc tạo mới SEO page (admin)
 */
async function updateSeoPage(req, res) {
  try {
    let { path } = req.params;
    
    // Nếu path không có, dùng '/'
    if (!path || path === '') {
      path = '/';
    }
    
    // Decode path
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(path);
    } catch (e) {
      decodedPath = path;
    }
    
    const {
      page_type,
      title,
      description,
      keywords,
      image,
      og_title,
      og_description,
      og_image,
      og_type,
      twitter_card,
      twitter_title,
      twitter_description,
      twitter_image,
      canonical_url,
      robots_index,
      robots_follow,
      robots_noarchive,
      robots_nosnippet,
      structured_data,
    } = req.body;

    // Ensure twitter_card and og_type are simple strings, not locale objects
    const safeTwitterCard = typeof twitter_card === 'string' ? twitter_card : (twitter_card?.vi || twitter_card?.en || twitter_card?.ja || 'summary_large_image');
    const safeOgType = typeof og_type === 'string' ? og_type : (og_type?.vi || og_type?.en || og_type?.ja || 'website');
    
    // Ensure page_type is a simple string, not a locale object or JSON string
    let safePageType = null;
    if (page_type) {
      if (typeof page_type === 'string') {
        // Check if it's a JSON string (starts with '{')
        if (page_type.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(page_type);
            // If it's a locale object, extract the first available value
            safePageType = parsed.vi || parsed.en || parsed.ja || null;
          } catch (e) {
            // If parsing fails, use the string as-is but truncate
            safePageType = page_type.substring(0, 50);
          }
        } else {
          safePageType = page_type.substring(0, 50);
        }
      } else if (typeof page_type === 'object') {
        // If it's already an object, extract the first available value
        safePageType = page_type.vi || page_type.en || page_type.ja || null;
      }
    }
    
    // Ensure og_type is a string and not longer than 50 characters
    const safeOgTypeTruncated = safeOgType && typeof safeOgType === 'string' ? safeOgType.substring(0, 50) : safeOgType;

    // Kiểm tra xem đã tồn tại chưa
    const checkResult = await pool.query(
      `SELECT id FROM seo_pages WHERE page_path = $1`,
      [decodedPath]
    );

    if (checkResult.rows.length > 0) {
      // Update
      const updateResult = await pool.query(
        `UPDATE seo_pages SET
          page_type = COALESCE($1, page_type),
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          keywords = COALESCE($4, keywords),
          image = COALESCE($5, image),
          og_title = COALESCE($6, og_title),
          og_description = COALESCE($7, og_description),
          og_image = COALESCE($8, og_image),
          og_type = COALESCE($9, og_type),
          twitter_card = COALESCE($10, twitter_card),
          twitter_title = COALESCE($11, twitter_title),
          twitter_description = COALESCE($12, twitter_description),
          twitter_image = COALESCE($13, twitter_image),
          canonical_url = COALESCE($14, canonical_url),
          robots_index = COALESCE($15, robots_index),
          robots_follow = COALESCE($16, robots_follow),
          robots_noarchive = COALESCE($17, robots_noarchive),
          robots_nosnippet = COALESCE($18, robots_nosnippet),
          structured_data = COALESCE($19, structured_data),
          updated_at = CURRENT_TIMESTAMP
        WHERE page_path = $20
        RETURNING *`,
        [
          safePageType,
          processLocaleField(title),
          processLocaleField(description),
          processLocaleField(keywords),
          image,
          processLocaleField(og_title),
          processLocaleField(og_description),
          og_image,
          safeOgTypeTruncated,
          safeTwitterCard,
          processLocaleField(twitter_title),
          processLocaleField(twitter_description),
          twitter_image,
          canonical_url,
          robots_index,
          robots_follow,
          robots_noarchive,
          robots_nosnippet,
          structured_data ? JSON.stringify(structured_data) : null,
          decodedPath,
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Cập nhật cấu hình SEO thành công',
        data: mapSeoPage(updateResult.rows[0]),
      });
    } else {
      // Insert
      const insertResult = await pool.query(
        `INSERT INTO seo_pages (
          page_path, page_type, title, description, keywords, image,
          og_title, og_description, og_image, og_type,
          twitter_card, twitter_title, twitter_description, twitter_image,
          canonical_url, robots_index, robots_follow, robots_noarchive, robots_nosnippet,
          structured_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          decodedPath,
          safePageType,
          processLocaleField(title) || null,
          processLocaleField(description) || null,
          processLocaleField(keywords) || null,
          image || null,
          processLocaleField(og_title) || null,
          processLocaleField(og_description) || null,
          og_image || null,
          safeOgTypeTruncated || 'website',
          safeTwitterCard || 'summary_large_image',
          processLocaleField(twitter_title) || null,
          processLocaleField(twitter_description) || null,
          twitter_image || null,
          canonical_url || null,
          robots_index !== undefined ? robots_index : true,
          robots_follow !== undefined ? robots_follow : true,
          robots_noarchive !== undefined ? robots_noarchive : false,
          robots_nosnippet !== undefined ? robots_nosnippet : false,
          structured_data ? JSON.stringify(structured_data) : null,
        ]
      );

      return res.status(201).json({
        success: true,
        message: 'Tạo cấu hình SEO thành công',
        data: mapSeoPage(insertResult.rows[0]),
      });
    }
  } catch (error) {
    console.error('Error updating SEO page:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật cấu hình SEO',
      error: error.message,
    });
  }
}

// Helper function to get localized text from locale object
const getLocalizedText = (value, locale) => {
  if (!value) return null;
  
  // If it's already a string, return as-is
  if (typeof value === 'string') {
    return value;
  }
  
  // If it's a locale object, get the value for the requested locale
  if (typeof value === 'object' && value !== null) {
    // Priority: requested locale -> vi -> en -> ja -> first available
    if (value[locale]) return value[locale];
    if (value.vi) return value.vi;
    if (value.en) return value.en;
    if (value.ja) return value.ja;
    
    // Fallback to first available value
    const firstValue = Object.values(value)[0];
    return typeof firstValue === 'string' ? firstValue : null;
  }
  
  return String(value);
};

/**
 * Lấy SEO theo page path (public - không cần auth)
 */
async function getPublicSeoByPath(req, res) {
  try {
    let { path } = req.params;
    
    // Nếu path không có, dùng '/'
    if (!path || path === '') {
      path = '/';
    }
    
    // Decode path
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(path);
    } catch (e) {
      decodedPath = path;
    }

    // Get locale from query parameter or Accept-Language header
    const locale = getLocaleFromRequest(req);

    const result = await pool.query(
      `SELECT * FROM seo_pages WHERE page_path = $1`,
      [decodedPath]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cấu hình SEO',
      });
    }

    const rawSeoData = result.rows[0];
    
    // Parse and localize all locale fields
    const seoData = {
      id: rawSeoData.id,
      page_path: rawSeoData.page_path,
      page_type: rawSeoData.page_type,
      title: getLocalizedText(parseLocaleField(rawSeoData.title), locale),
      description: getLocalizedText(parseLocaleField(rawSeoData.description), locale),
      keywords: getLocalizedText(parseLocaleField(rawSeoData.keywords), locale),
      image: rawSeoData.image,
      og_title: getLocalizedText(parseLocaleField(rawSeoData.og_title), locale),
      og_description: getLocalizedText(parseLocaleField(rawSeoData.og_description), locale),
      og_image: rawSeoData.og_image,
      og_type: rawSeoData.og_type,
      twitter_card: rawSeoData.twitter_card,
      twitter_title: getLocalizedText(parseLocaleField(rawSeoData.twitter_title), locale),
      twitter_description: getLocalizedText(parseLocaleField(rawSeoData.twitter_description), locale),
      twitter_image: rawSeoData.twitter_image,
      canonical_url: rawSeoData.canonical_url,
      robots_index: rawSeoData.robots_index,
      robots_follow: rawSeoData.robots_follow,
      robots_noarchive: rawSeoData.robots_noarchive,
      robots_nosnippet: rawSeoData.robots_nosnippet,
      structured_data: rawSeoData.structured_data,
      created_at: rawSeoData.created_at,
      updated_at: rawSeoData.updated_at,
    };
    
    // Parse structured_data nếu có
    if (seoData.structured_data) {
      try {
        seoData.structured_data = typeof seoData.structured_data === 'string' 
          ? JSON.parse(seoData.structured_data)
          : seoData.structured_data;
      } catch (e) {
        console.error('Error parsing structured_data:', e);
      }
    }

    return res.status(200).json({
      success: true,
      data: seoData,
    });
  } catch (error) {
    console.error('Error fetching public SEO:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cấu hình SEO',
      error: error.message,
    });
  }
}

module.exports = {
  getSeoPages,
  getSeoPageByPath,
  updateSeoPage,
  getPublicSeoByPath,
};


