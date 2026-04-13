const PublicationService = require('../services/admin/publication.service');
const { pool } = require('../config/database');

// Helper để tạo response chuẩn 7 trường
const sendResponse = (res, status, message, data = null, errors = null, pagination = null) => {
  const response = {
    code: status >= 200 && status < 300 ? 0 : status,
    success: status >= 200 && status < 300,
    message: message,
    data: data,
    errorId: null,
    appId: null,
    errors: errors
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(status).json(response);
};

const mapRelatedDocument = (item) => ({
  id: item.id,
  code: item.code || null,
  isbn: item.isbn || null,
  title: item.title || '',
  author: item.author || '',
  authors_list: Array.isArray(item.authors_list) ? item.authors_list : [],
  slug: item.slug || null,
  publisher_name: item.publisher_name || null,
  cover_image: item.cover_image || null,
  thumbnail: item.thumbnail || item.cover_image || null,
  publication_year: item.publication_year || null,
  pages: item.pages || null,
  status: item.status || null,
  media_type: item.media_type || null,
  access_policy: item.access_policy || null,
  related_score: item.related_score ?? null,
  view_count: item.view_count ?? null,
});

const normalizeMediaType = (item = {}) => {
  if (item.media_type) return item.media_type;
  return item.is_digital ? 'Digital' : 'Physical';
};

const mapPublicationCardDto = (item = {}) => {
  const mediaType = normalizeMediaType(item);
  const isDigital = mediaType === 'Digital' || mediaType === 'Hybrid' || Boolean(item.is_digital);
  return {
    id: item.id,
    code: item.code || null,
    isbn: item.isbn || null,
    title: item.title || '',
    author: item.author || '',
    authors_list: Array.isArray(item.authors_list) ? item.authors_list : [],
    slug: item.slug || null,
    cover_image: item.cover_image || null,
    thumbnail: item.thumbnail || item.cover_image || null,
    dominant_color: item.dominant_color || '#4f46e5',
    publication_year: item.publication_year || null,
    pages: item.pages || null,
    media_type: mediaType,
    is_digital: isDigital,
    format: mediaType,
    status: item.status || 'available',
    access_policy: item.access_policy || 'basic',
    cooperation_status: item.cooperation_status || null,
    publisher_name: item.publisher_name || null,
    copy_count: Number(item.copy_count || item.total_copies || item.countCopies || 0),
    total_copies: Number(item.total_copies || item.copy_count || item.countCopies || 0),
    countCopies: Number(item.countCopies || item.total_copies || item.copy_count || 0),
    view_count: Number(item.view_count || 0),
    favorite_count: Number(item.favorite_count || 0),
  };
};

const normalizeTrailerInfo = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    return {
      url: value,
      provider: null,
      thumbnail: null,
      duration: null,
      title: null,
    };
  }
  if (typeof value === 'object') {
    return {
      url: value.url || value.link || value.video_url || null,
      provider: value.provider || value.platform || null,
      thumbnail: value.thumbnail || value.image || null,
      duration: value.duration || null,
      title: value.title || null,
    };
  }
  return null;
};

const normalizePreviewPages = (pages = []) => {
  if (!Array.isArray(pages)) return [];
  return pages.map((p, idx) => {
    if (typeof p === 'string') {
      return {
        index: idx + 1,
        label: `Trang ${idx + 1}`,
        value: p,
      };
    }
    if (p && typeof p === 'object') {
      return {
        index: Number(p.index || p.page || idx + 1),
        label: p.label || p.title || `Trang ${idx + 1}`,
        value: p.value || p.url || p.content || p,
      };
    }
    return {
      index: idx + 1,
      label: `Trang ${idx + 1}`,
      value: p,
    };
  });
};

const normalizeDigitizedFiles = (files = []) => {
  if (!Array.isArray(files)) return [];
  return files.map((f, idx) => {
    if (typeof f === 'string') {
      return {
        id: `file-${idx + 1}`,
        name: `Digital File ${idx + 1}`,
        type: 'asset',
        url: f,
        path: null,
        size: null,
      };
    }
    return {
      id: f.id || `file-${idx + 1}`,
      name: f.name || `Digital File ${idx + 1}`,
      type: f.type || 'asset',
      url: f.url || null,
      path: f.path || null,
      size: typeof f.size === 'number' ? f.size : (f.size ? Number(f.size) : null),
    };
  });
};

const normalizeChapters = (toc = [], totalPages = 0) => {
  if (!Array.isArray(toc) || toc.length === 0) return [];

  return toc.map((item, idx) => {
    if (typeof item === 'string') {
      return {
        id: `chapter-${idx + 1}`,
        title: item,
        order: idx + 1,
        start_page: idx + 1,
        end_page: idx + 1,
        page_range: `${idx + 1}-${idx + 1}`,
      };
    }

    const start = Number(
      item?.start_page ||
      item?.page_from ||
      item?.from ||
      item?.page ||
      item?.start ||
      idx + 1
    );

    const endRaw = Number(
      item?.end_page ||
      item?.page_to ||
      item?.to ||
      item?.end ||
      start
    );

    const startPage = Number.isFinite(start) && start > 0 ? start : idx + 1;
    let endPage = Number.isFinite(endRaw) && endRaw > 0 ? endRaw : startPage;
    if (endPage < startPage) endPage = startPage;
    if (totalPages > 0 && endPage > totalPages) endPage = totalPages;

    return {
      id: item?.id || `chapter-${idx + 1}`,
      title: item?.title || item?.name || item?.label || `Chương ${idx + 1}`,
      order: Number(item?.order || idx + 1),
      start_page: startPage,
      end_page: endPage,
      page_range: `${startPage}-${endPage}`,
    };
  });
};

const extractFullTextPayload = (pub = {}) => {
  const digitalContent = pub.digital_content || {};
  const metadata = pub.metadata || {};

  const candidates = [
    digitalContent.full_text_html,
    digitalContent.fullTextHtml,
    metadata.full_text_html,
    metadata.fullTextHtml,
    digitalContent.full_text_raw,
    digitalContent.fullText,
    metadata.full_text_raw,
    metadata.fullText,
    digitalContent.text,
    digitalContent.content,
    metadata.content,
  ];

  let content = '';
  for (const source of candidates) {
    if (typeof source === 'string' && source.trim()) {
      content = source.trim();
      break;
    }
  }

  if (!content) {
    return {
      enabled: false,
      format: null,
      content: '',
      word_count: 0,
      excerpt: '',
    };
  }

  const isHtml = /<[^>]+>/g.test(content);
  const plain = isHtml ? content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : content;
  const words = plain ? plain.split(/\s+/).filter(Boolean) : [];

  return {
    enabled: true,
    format: isHtml ? 'html' : 'text',
    content,
    word_count: words.length,
    excerpt: plain.slice(0, 280),
  };
};

const buildReadingContentDto = (pub = {}, canRead = false) => {
  const isDigitalLike = Boolean(pub.is_digital || pub.media_type === 'Digital' || pub.media_type === 'Hybrid');
  const totalPages = Number(pub.pages || 0);
  const pdfUrl = pub.digital_file_url || null;
  const previewPages = normalizePreviewPages(pub.preview_pages || []);
  const chapters = normalizeChapters(pub.toc || [], totalPages);
  const fullText = extractFullTextPayload(pub);

  const pageModeEnabled = Boolean(isDigitalLike && pdfUrl && totalPages > 0);
  const chapterModeEnabled = Boolean(pageModeEnabled && chapters.length > 0);
  const scrollModeEnabled = Boolean(fullText.enabled);

  const availableModes = [
    pageModeEnabled ? 'page' : null,
    chapterModeEnabled ? 'chapter' : null,
    scrollModeEnabled ? 'scroll' : null,
  ].filter(Boolean);

  const defaultMode = availableModes[0] || null;

  return {
    can_read: canRead,
    source_policy: {
      page: 'pdf',
      chapter: 'pdf',
      scroll: 'fulltext',
    },
    available_modes: availableModes,
    default_mode: defaultMode,
    page_mode: {
      enabled: pageModeEnabled,
      pdf_url: pdfUrl,
      total_pages: totalPages,
      preview_pages: previewPages,
    },
    chapter_mode: {
      enabled: chapterModeEnabled,
      total_chapters: chapters.length,
      chapters,
    },
    scroll_mode: {
      enabled: scrollModeEnabled,
      full_text: fullText,
    },
  };
};

const buildPublicationDetailDto = (pub, canRead) => ({
  id: pub.id,
  code: pub.code || null,
  isbn: pub.isbn || null,
  title: pub.title || '',
  author: pub.author || '',
  authors_list: Array.isArray(pub.authors_list) ? pub.authors_list : [],
  slug: pub.slug || null,
  publisher_name: pub.publisher_name || null,
  description: pub.description || '',
  cover_image: pub.cover_image || null,
  thumbnail: pub.thumbnail || pub.cover_image || null,
  dominant_color: pub.dominant_color || '#4f46e5',
  publication_year: pub.publication_year || null,
  pages: pub.pages || null,
  status: pub.status || 'available',
  media_type: pub.media_type || 'Physical',
  is_digital: Boolean(pub.is_digital || pub.media_type === 'Digital' || pub.media_type === 'Hybrid'),
  format: pub.media_type || (pub.is_digital ? 'Digital' : 'Physical'),
  cooperation_status: pub.cooperation_status || null,
  view_count: Number(pub.view_count || 0),
  favorite_count: Number(pub.favorite_count || 0),
  copy_count: Array.isArray(pub.copies) ? pub.copies.length : Number(pub.copy_count || 0),
  content_url: pub.content_url || null,
  digital_file_url: pub.digital_file_url || null,
  access_policy: pub.access_policy || 'basic',
  canRead,
  current_collection: pub.current_collection || null,
  collection_list: Array.isArray(pub.collection_list) ? pub.collection_list : [],
  copies: Array.isArray(pub.copies) ? pub.copies : [],
  related_documents: (pub.related_documents || pub.relatedItems || []).map(mapRelatedDocument),
  information_fields: Array.isArray(pub.information_fields) ? pub.information_fields : [],
  trailerInfo: normalizeTrailerInfo(pub.trailerInfo),
  preview_pages: normalizePreviewPages(pub.preview_pages || []),
  digitized_files: normalizeDigitizedFiles(pub.digitized_files || []),
  reading_content: buildReadingContentDto(pub, canRead),
  user_interaction: pub.user_interaction || null,
});

const getDisplayText = (value, fallback = '') => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return value.vi || value.en || fallback;
  }
  return fallback;
};

/**
 * Lấy danh sách ấn phẩm (Tìm kiếm & Phân trang)
 */
exports.getPublications = async (req, res, next) => {
  try {
    const { 
      search, category, page = 1, limit = 10, is_digital,
      status,
      title, author, publisher_id, year_from, year_to, language, subject,
      sort_by, order, media_type
    } = req.query;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    
    const results = await PublicationService.getAll({ 
      page: safePage, limit: safeLimit, search, is_digital, 
      collection_id: category,
      status: status || 'all',
      cooperation_status: 'cooperating',
      title, author, publisher_id, year_from, year_to, language, subject,
      sort_by, order,
      media_type: media_type || (is_digital === 'true' ? 'Digital' : 'all')
    });

    const normalized = (results.publications || []).map(mapPublicationCardDto);
    return sendResponse(res, 200, "Lấy danh sách ấn phẩm thành công", normalized, null, results.pagination);
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy chi tiết ấn phẩm và tăng view tự động
 */
exports.getPublicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = null;
    let readerTier = 'basic';

    // 1. Giải mã Token để lấy thông tin cá nhân hóa (nếu có)
    if (token) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        userId = decoded.sub || decoded.id;
        readerTier = decoded.tierCode || decoded.tier_code || 'basic';
      } catch (e) {
        // Token không lệ -> Khách vãng lai
      }
    }

    // 2. Lấy chi tiết từ Service (Đã bao gồm tương tác cá nhân)
    const pub = await PublicationService.getPublicationDetail(id, userId);
    if (!pub) {
      return sendResponse(res, 404, "Không tìm thấy ấn phẩm trên hệ thống", null, ["Publication not found"]);
    }

    // 3. Ghi nhận lượt xem theo ID thực để hỗ trợ cả truy vấn bằng slug
    try {
      await pool.query(
        'INSERT INTO interaction_logs (object_id, object_type, action_type, member_id, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
        [pub.id, 'book', 'view', userId]
      );
    } catch (e) {
      console.warn("Lỗi ghi log lượt xem:", e.message);
    }

    // 4. Kiểm tra quyền truy cập Policy
    const tierRank = { basic: 1, premium: 2, vip: 3 };
    const reqRank = tierRank[pub.access_policy?.toLowerCase() || 'basic'] || 1;
    const userRank = tierRank[readerTier.toLowerCase() || 'basic'] || 1;
    const canRead = (pub.access_policy === 'basic') || (token && userRank >= reqRank);

    let readingProgress = null;
    if (userId) {
      try {
        const { rows: progressRows } = await pool.query(
          `SELECT user_id, book_id, last_page, progress_percent, is_finished, last_read_at, updated_at
           FROM user_reading_progress
           WHERE user_id = $1 AND book_id = $2
           LIMIT 1`,
          [userId, pub.id]
        );
        if (progressRows.length > 0) {
          readingProgress = progressRows[0];
        }
      } catch (e) {
        console.warn('Không lấy được tiến độ đọc:', e.message);
      }
    }

    const detailDto = buildPublicationDetailDto(pub, canRead);
    detailDto.readingProgress = readingProgress;

    return sendResponse(
      res,
      200,
      "Lấy thông tin chi tiết ấn phẩm thành công",
      detailDto
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy dữ liệu đọc online chuẩn cho 3 chế độ: trang/chương (PDF) và cuộn (fulltext)
 */
exports.getPublicationReadingContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let userId = null;
    let readerTier = 'basic';

    if (token) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        userId = decoded.sub || decoded.id;
        readerTier = decoded.tierCode || decoded.tier_code || 'basic';
      } catch (_) {
        // token không hợp lệ thì xử lý như khách
      }
    }

    const pub = await PublicationService.getPublicationDetail(id, userId);
    if (!pub) {
      return sendResponse(res, 404, 'Không tìm thấy ấn phẩm trên hệ thống', null, ['Publication not found']);
    }

    const tierRank = { basic: 1, premium: 2, vip: 3 };
    const reqRank = tierRank[pub.access_policy?.toLowerCase() || 'basic'] || 1;
    const userRank = tierRank[readerTier.toLowerCase() || 'basic'] || 1;
    const canRead = (pub.access_policy === 'basic') || (token && userRank >= reqRank);

    const readingContent = buildReadingContentDto(pub, canRead);

    return sendResponse(res, 200, 'Lấy dữ liệu đọc online thành công', {
      publication: {
        id: pub.id,
        title: pub.title || '',
        author: pub.author || '',
        thumbnail: pub.thumbnail || pub.cover_image || null,
        media_type: pub.media_type || 'Physical',
        access_policy: pub.access_policy || 'basic',
      },
      reading_content: readingContent,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy danh sách tài liệu liên quan cho trang chi tiết ấn phẩm
 */
exports.getRelatedPublications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 24);
    const related = await PublicationService.getRelatedPublications(id, limit);
    const normalized = (related || []).map((item) => ({
      ...mapPublicationCardDto(item),
      related_score: item.related_score ?? null,
    }));

    return sendResponse(res, 200, 'Lấy danh sách tài liệu liên quan thành công', normalized);
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy danh sách lookup/filter cho màn hình app (author, publisher, year...)
 */
exports.getPublicationLookups = async (req, res, next) => {
  try {
    const lookups = await PublicationService.getPublicationLookups();
    return sendResponse(res, 200, 'Lấy danh sách trường lọc ấn phẩm thành công', lookups);
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy các bản sao (copies) của ấn phẩm để mượn (Physical Books)
 */
exports.getPublicationCopies = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT pc.id, pc.barcode, pc.copy_number, pc.price, pc.status, pc.condition, pc.storage_location_id,
             sl.name as storage_name
      FROM publication_copies pc
      LEFT JOIN storage_locations sl ON pc.storage_location_id = sl.id
      WHERE pc.publication_id = $1 
      ORDER BY pc.copy_number ASC
    `;
    const { rows } = await pool.query(query, [id]);
    const normalized = rows.map((c) => ({
      id: c.id,
      barcode: c.barcode,
      copy_number: c.copy_number,
      price: Number(c.price || 0),
      status: c.status,
      condition: c.condition,
      storage_location_id: c.storage_location_id || null,
      storage_name: c.storage_name || null,
    }));
    
    return sendResponse(res, 200, "Lấy danh sách các bản sao sách in thành công", normalized);
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy tóm tắt AI cho ấn phẩm
 */
exports.summarizePublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pub = await PublicationService.getPublicationDetail(id);
    if (!pub) {
      return sendResponse(res, 404, "Không tìm thấy nội dung để tóm tắt", null, ["Not found"]);
    }

    const hasCachedSummary = Boolean(pub.ai_summary);
    const summary = hasCachedSummary
      ? pub.ai_summary
      : `Hệ thống AI đang phân tích nội dung cho ấn phẩm "${getDisplayText(pub.title, 'Chưa có tiêu đề')}".`;
    
    return sendResponse(res, 200, "Cung cấp tóm tắt AI thành công", {
      summary,
      cached: hasCachedSummary,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lấy dữ liệu Trang chủ thực tế (Banner, Trending, Newest)
 */
exports.getHomePageData = async (req, res, next) => {
  try {
    // 1. Ấn phẩm mới nhất
    const newestResults = await PublicationService.getAll({ 
      page: 1, limit: 10, status: 'available', cooperation_status: 'cooperating' 
    });
    
    // 2. Ấn phẩm nổi bật / Trending
    const trendingResults = await PublicationService.getAll({ 
      page: 1, limit: 10, status: 'available', cooperation_status: 'cooperating' 
    });

    const trending = (trendingResults.publications || []).map(mapPublicationCardDto);
    const newest = (newestResults.publications || []).map(mapPublicationCardDto);

    const banners = trending.slice(0, 5).map(p => ({
      id: p.id,
      title: getDisplayText(p.title, 'Chưa có tiêu đề'),
      image: p.thumbnail,
      dominantColor: p.dominant_color || '#4f46e5'
    }));

    // 3. Danh mục nổi bật
    const categories = [
      { id: "col-01", name: "Công nghệ thông tin", icon: "laptop" },
      { id: "col-02", name: "Kinh tế", icon: "trending-up" },
      { id: "col-03", name: "Văn học", icon: "book-open" },
      { id: "col-04", name: "Kỹ năng sống", icon: "users" }
    ];

    return sendResponse(res, 200, "Lấy dữ liệu trang chủ thành công", {
      banners,
      trending,
      newest,
      categories
    });
  } catch (error) {
    return next(error);
  }
};
