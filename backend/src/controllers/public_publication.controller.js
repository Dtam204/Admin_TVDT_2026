const PublicationService = require('../services/admin/publication.service');
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {
  getReadingProgressSchema,
  buildReadingProgressSelectClause,
  normalizeReadingProgressRow,
} = require('../utils/reading_progress_schema');

const fileHashCache = new Map();

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

const normalizeLoopbackUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return value;
  const publicBase = (process.env.PUBLIC_BASE_URL || '').trim().replace(/\/$/, '');
  if (!publicBase) return value;
  return value.replace(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i, publicBase);
};

const resolveReaderContext = (req) => {
  const authHeader = req?.headers?.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return { token: null, userId: null, readerTier: 'basic' };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    return {
      token,
      userId: decoded.sub || decoded.id || null,
      readerTier: decoded.tierCode || decoded.tier_code || 'basic',
    };
  } catch (_) {
    return { token: null, userId: null, readerTier: 'basic' };
  }
};

const getPublicationMediaType = (pub = {}) => {
  if (pub.media_type) return String(pub.media_type);
  return pub.is_digital ? 'Digital' : 'Physical';
};

const isDigitalLikePublication = (pub = {}) => {
  const media = getPublicationMediaType(pub).toLowerCase();
  return media === 'digital' || media === 'hybrid' || Boolean(pub.is_digital);
};

const hasPdfForOnlineRead = (pub = {}) => Boolean(pub.digital_file_url);

const hasFullTextForOnlineRead = (pub = {}) => {
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
  return candidates.some((v) => typeof v === 'string' && v.trim().length > 0);
};

const canBorrowPhysicalPublication = (pub = {}) => {
  const media = getPublicationMediaType(pub).toLowerCase();
  return media === 'physical' || media === 'hybrid';
};

const hasOnlineReadableContent = (pub = {}) => {
  if (!isDigitalLikePublication(pub)) return false;
  return hasPdfForOnlineRead(pub) || hasFullTextForOnlineRead(pub);
};

const canAccessByPolicy = (pub = {}, token, readerTier = 'basic') => {
  const tierRank = { basic: 1, premium: 2, vip: 3 };
  const reqRank = tierRank[(pub.access_policy || 'basic').toLowerCase()] || 1;
  const userRank = tierRank[(readerTier || 'basic').toLowerCase()] || 1;
  return (pub.access_policy === 'basic') || (Boolean(token) && userRank >= reqRank);
};

const canReadPublication = (pub = {}, token, readerTier = 'basic') => {
  return canAccessByPolicy(pub, token, readerTier) && hasOnlineReadableContent(pub);
};

const getPublicBaseUrl = (req) => {
  const explicit = (process.env.PUBLIC_BASE_URL || '').trim().replace(/\/$/, '');
  if (explicit) return explicit;

  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  const proto = (forwardedProto ? String(forwardedProto).split(',')[0].trim() : req?.protocol) || 'http';
  const host = req?.headers?.host;
  if (!host) return '';
  return `${proto}://${host}`;
};

const toAbsoluteUrl = (value, req) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = normalizeLoopbackUrl(value.trim());
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (!normalized.startsWith('/')) return normalized;
  const base = getPublicBaseUrl(req);
  return base ? `${base}${normalized}` : normalized;
};

const toClientPreferredUrl = (value, req) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const raw = value.trim();

  if (raw.startsWith('/')) return raw;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1') {
        return `${parsed.pathname || ''}${parsed.search || ''}` || '/';
      }
      return raw;
    } catch (_) {
      return raw;
    }
  }

  const absolute = toAbsoluteUrl(raw, req);
  return absolute || raw;
};

const resolveLocalUploadPath = (fileUrl) => {
  if (typeof fileUrl !== 'string' || !fileUrl.trim()) return null;
  const raw = fileUrl.trim();

  let pathname = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      pathname = parsed.pathname;
    } catch (_) {
      return null;
    }
  }

  if (pathname.startsWith('/uploads/')) {
    return path.join(process.cwd(), pathname.replace(/^\//, ''));
  }

  if (pathname.startsWith('uploads/')) {
    return path.join(process.cwd(), pathname);
  }

  return null;
};

const computeFileHash = async (filePath, stat) => {
  const cacheKey = `${filePath}|${stat.size}|${stat.mtimeMs}`;
  if (fileHashCache.has(cacheKey)) return fileHashCache.get(cacheKey);

  const hash = await new Promise((resolve, reject) => {
    const hasher = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hasher.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hasher.digest('hex')));
  });

  fileHashCache.set(cacheKey, hash);
  return hash;
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
      const parsedPage = Number(p);
      const pageValue = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : (idx + 1);
      return {
        index: pageValue,
        label: `Trang ${pageValue}`,
        value: pageValue,
      };
    }
    if (p && typeof p === 'object') {
      const parsedPage = Number(p.value || p.page || p.index || idx + 1);
      const pageValue = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : (idx + 1);
      return {
        index: pageValue,
        label: p.label || p.title || `Trang ${pageValue}`,
        value: pageValue,
      };
    }
    return {
      index: idx + 1,
      label: `Trang ${idx + 1}`,
      value: p,
    };
  });
};

const buildFallbackPreviewPages = (totalPages = 0) => {
  const safeTotal = Math.max(Number(totalPages) || 0, 0);
  if (!safeTotal) return [];
  // Metadata pages are lightweight, so return full page list for accurate page-based readers.
  const size = Math.min(safeTotal, 5000);

  return Array.from({ length: size }, (_, i) => {
    const page = i + 1;
    return {
      index: page,
      label: `Trang ${page}`,
      value: page,
    };
  });
};

const buildCanonicalPdfPageList = (totalPages = 0, existingPages = []) => {
  const safeTotal = Math.max(Number(totalPages) || 0, 0);
  if (!safeTotal) return [];

  // Always return canonical 1..N page list for stable cross-device sync.
  return buildFallbackPreviewPages(safeTotal);
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

    let startPage = Number.isFinite(start) && start > 0 ? start : idx + 1;
    if (totalPages > 0 && startPage > totalPages) startPage = totalPages;
    let endPage = Number.isFinite(endRaw) && endRaw > 0 ? endRaw : startPage;
    if (totalPages > 0 && endPage > totalPages) endPage = totalPages;
    if (endPage < startPage) endPage = startPage;

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

const buildPdfAssetMeta = async (pub = {}, req) => {
  const rawPdfUrl = pub.digital_file_url || null;
  if (!rawPdfUrl) return null;

  const pdfUrl = toClientPreferredUrl(rawPdfUrl, req);
  const pdfUrlAbsolute = toAbsoluteUrl(rawPdfUrl, req);
  const downloadPath = `/api/public/publications/${pub.id}/pdf-file`;
  const downloadUrl = downloadPath;
  const downloadUrlAbsolute = toAbsoluteUrl(downloadPath, req) || downloadPath;

  const metadata = pub.metadata || {};
  const localPath = resolveLocalUploadPath(rawPdfUrl);
  let fileSize = Number(metadata.pdf_file_size || 0) || null;
  let updatedAt = metadata.pdf_updated_at || null;
  let fileHash = metadata.pdf_file_hash || null;
  let version = metadata.pdf_version || null;
  let mimeType = metadata.pdf_mime_type || 'application/pdf';

  if (localPath && fs.existsSync(localPath)) {
    const stat = await fs.promises.stat(localPath);
    fileSize = stat.size;
    updatedAt = stat.mtime.toISOString();
    mimeType = 'application/pdf';
    fileHash = await computeFileHash(localPath, stat);
    version = `${stat.size}-${Math.floor(stat.mtimeMs)}`;
  }

  return {
    pdf_url: pdfUrl,
    download_url: downloadUrl,
    pdf_url_absolute: pdfUrlAbsolute,
    download_url_absolute: downloadUrlAbsolute,
    file_hash: fileHash,
    version: version || (fileHash ? fileHash.slice(0, 16) : null),
    file_size: fileSize,
    updated_at: updatedAt,
    mime_type: mimeType,
    supports_range: true,
  };
};

const buildReadingContentDto = async (pub = {}, canRead = false, req = null) => {
  const isDigitalLike = isDigitalLikePublication(pub);
  const totalPages = Number(pub.pages || 0);
  const pdfAsset = await buildPdfAssetMeta(pub, req);
  const pdfUrl = pdfAsset?.pdf_url || toClientPreferredUrl(pub.digital_file_url || null, req);
  const normalizedPreviewPages = normalizePreviewPages(pub.preview_pages || []);
  const chapters = normalizeChapters(pub.toc || [], totalPages);
  const fullText = extractFullTextPayload(pub);

  const pageModeEnabled = Boolean(isDigitalLike && pdfUrl && totalPages > 0);
  const previewPages = pageModeEnabled
    ? buildCanonicalPdfPageList(totalPages, normalizedPreviewPages)
    : [];
  const chapterModeEnabled = Boolean(pageModeEnabled && chapters.length > 0);
  const scrollModeEnabled = Boolean(isDigitalLike && fullText.enabled);

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
      pdf_asset: pdfAsset,
      total_pages: totalPages,
      preview_pages: previewPages,
      preview_source: pageModeEnabled ? 'pdf_pages' : null,
      preview_images_ready: false,
    },
    chapter_mode: {
      enabled: chapterModeEnabled,
      total_chapters: chapters.length,
      chapters: chapterModeEnabled ? chapters : [],
    },
    scroll_mode: {
      enabled: scrollModeEnabled,
      full_text: scrollModeEnabled ? fullText : null,
    },
  };
};

const buildPublicationDetailDto = async (pub, canRead, req = null) => {
  const mediaType = getPublicationMediaType(pub);
  const readingContent = await buildReadingContentDto(pub, canRead, req);
  const canBorrow = canBorrowPhysicalPublication(pub);
  const canDownloadPdf = Boolean(canRead && readingContent.page_mode?.enabled);

  return {
    id: pub.id,
    code: pub.code || null,
    isbn: pub.isbn || null,
    title: pub.title || '',
    author: pub.author || '',
    authors_list: Array.isArray(pub.authors_list) ? pub.authors_list : [],
    slug: pub.slug || null,
    publisher_name: pub.publisher_name || null,
    description: pub.description || '',
    cover_image: toAbsoluteUrl(pub.cover_image || null, req),
    thumbnail: toAbsoluteUrl(pub.thumbnail || pub.cover_image || null, req),
    dominant_color: pub.dominant_color || '#4f46e5',
    publication_year: pub.publication_year || null,
    pages: pub.pages || null,
    status: pub.status || 'available',
    media_type: mediaType,
    is_digital: isDigitalLikePublication(pub),
    format: mediaType,
    cooperation_status: pub.cooperation_status || null,
    view_count: Number(pub.view_count || 0),
    favorite_count: Number(pub.favorite_count || 0),
    copy_count: Array.isArray(pub.copies) ? pub.copies.length : Number(pub.copy_count || 0),
    content_url: toAbsoluteUrl(pub.content_url || null, req),
    digital_file_url: toAbsoluteUrl(pub.digital_file_url || null, req),
    digital_file_path: toClientPreferredUrl(pub.digital_file_url || null, req),
    access_policy: pub.access_policy || 'basic',
    canRead,
    actions: {
      can_read_online: Boolean(canRead),
      can_download_pdf: canDownloadPdf,
      can_borrow_request: canBorrow,
      required_action: canRead ? 'read_now' : (canBorrow ? 'borrow_request' : 'none'),
    },
    current_collection: pub.current_collection || null,
    collection_list: Array.isArray(pub.collection_list) ? pub.collection_list : [],
    copies: Array.isArray(pub.copies) ? pub.copies : [],
    related_documents: (pub.related_documents || pub.relatedItems || []).map(mapRelatedDocument),
    information_fields: Array.isArray(pub.information_fields) ? pub.information_fields : [],
    trailerInfo: normalizeTrailerInfo(pub.trailerInfo),
    preview_pages: normalizePreviewPages(pub.preview_pages || []),
    digitized_files: normalizeDigitizedFiles(pub.digitized_files || []),
    reading_content: readingContent,
    user_interaction: pub.user_interaction || null,
  };
};

const buildPublicationActionsDto = (pub, canRead, readingContent) => ({
  can_read_online: Boolean(canRead),
  can_download_pdf: Boolean(canRead && readingContent?.page_mode?.enabled),
  can_borrow_request: canBorrowPhysicalPublication(pub),
  required_action: canRead
    ? 'read_now'
    : (canBorrowPhysicalPublication(pub) ? 'borrow_request' : 'none'),
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
    const { token, userId, readerTier } = resolveReaderContext(req);

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
    const canRead = canReadPublication(pub, token, readerTier);

    let readingProgress = null;
    if (userId) {
      try {
        const schema = await getReadingProgressSchema(pool);
        if (schema.hasTable && schema.pageColumn) {
          const selectClause = buildReadingProgressSelectClause(schema);
          const { rows: progressRows } = await pool.query(
            `SELECT ${selectClause}
             FROM user_reading_progress
             WHERE user_id = $1 AND book_id = $2
             LIMIT 1`,
            [userId, pub.id]
          );
          if (progressRows.length > 0) {
            readingProgress = normalizeReadingProgressRow(progressRows[0]);
          }
        }
      } catch (e) {
        console.warn('Không lấy được tiến độ đọc:', e.message);
      }
    }

    const detailDto = await buildPublicationDetailDto(pub, canRead, req);
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
    const { token, userId, readerTier } = resolveReaderContext(req);

    const pub = await PublicationService.getPublicationDetail(id, userId);
    if (!pub) {
      return sendResponse(res, 404, 'Không tìm thấy ấn phẩm trên hệ thống', null, ['Publication not found']);
    }

    const canRead = canReadPublication(pub, token, readerTier);

    const readingContent = await buildReadingContentDto(pub, canRead, req);
    const canBorrow = canBorrowPhysicalPublication(pub);

    return sendResponse(res, 200, 'Lấy dữ liệu đọc online thành công', {
      publication: {
        id: pub.id,
        title: pub.title || '',
        author: pub.author || '',
        thumbnail: toAbsoluteUrl(pub.thumbnail || pub.cover_image || null, req),
        media_type: getPublicationMediaType(pub),
        access_policy: pub.access_policy || 'basic',
        actions: {
          can_read_online: Boolean(canRead),
          can_download_pdf: Boolean(canRead && readingContent.page_mode?.enabled),
          can_borrow_request: canBorrow,
          required_action: canRead ? 'read_now' : (canBorrow ? 'borrow_request' : 'none'),
        },
      },
      reading_content: readingContent,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Trả file PDF thực tế để app tải lần đầu/offline cache (hỗ trợ Range)
 */
exports.getPublicationPdfFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token, userId, readerTier } = resolveReaderContext(req);

    const pub = await PublicationService.getPublicationDetail(id, userId);
    if (!pub) {
      return sendResponse(res, 404, 'Không tìm thấy ấn phẩm trên hệ thống', null, ['Publication not found']);
    }

    if (!pub.digital_file_url) {
      return sendResponse(res, 404, 'Ấn phẩm chưa có tệp PDF để tải', null, ['PDF file not found']);
    }

    const canRead = canReadPublication(pub, token, readerTier);
    if (!canRead) {
      return sendResponse(res, 403, 'Bạn không có quyền tải tệp PDF của ấn phẩm này', null, ['Access denied']);
    }

    const localPath = resolveLocalUploadPath(pub.digital_file_url);
    if (!localPath || !fs.existsSync(localPath)) {
      const externalUrl = toAbsoluteUrl(pub.digital_file_url, req);
      if (externalUrl && /^https?:\/\//i.test(externalUrl)) {
        return res.redirect(302, externalUrl);
      }
      return sendResponse(res, 404, 'Không tìm thấy tệp PDF trên máy chủ', null, ['Local PDF file missing']);
    }

    const stat = await fs.promises.stat(localPath);
    const fileSize = stat.size;
    const fileHash = await computeFileHash(localPath, stat);
    const etag = `"${fileHash}"`;
    const lastModified = stat.mtime.toUTCString();

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', lastModified);
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
    res.setHeader('Content-Disposition', `inline; filename="publication-${pub.id}.pdf"`);

    const range = req.headers.range;
    if (range) {
      const bytesPrefix = 'bytes=';
      if (!range.startsWith(bytesPrefix)) {
        return res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
      }

      const [startRaw, endRaw] = range.slice(bytesPrefix.length).split('-');
      const start = Number(startRaw);
      const end = endRaw ? Number(endRaw) : fileSize - 1;

      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || end >= fileSize) {
        return res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
      }

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', end - start + 1);
      fs.createReadStream(localPath, { start, end }).pipe(res);
      return;
    }

    res.status(200);
    res.setHeader('Content-Length', fileSize);
    fs.createReadStream(localPath).pipe(res);
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
