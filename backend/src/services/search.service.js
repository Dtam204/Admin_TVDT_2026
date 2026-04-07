const { pool } = require('../config/database');
const PublicationService = require('./admin/publication.service');

/**
 * SearchService — Tập trung toàn bộ logic tìm kiếm cho Mobile App
 * Tách biệt khỏi controller để tái sử dụng và dễ test.
 */
class SearchService {
  /**
   * Helper: Parse JSON title/description từ JSONB PostgreSQL
   */
  static _parseTitle(val) {
    if (!val) return '';
    if (typeof val === 'object') return val.vi || val.en || '';
    try {
      const parsed = JSON.parse(val);
      return parsed.vi || parsed.en || val;
    } catch {
      return val;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // SEARCH BOOKS — Dùng cho cả AI Smart Search và Basic Search
  // ─────────────────────────────────────────────────────────────────

  /**
   * Tìm kiếm ấn phẩm từ args của Gemini Function Calling
   * @param {object} args — params trực tiếp từ AI function call
   * @param {number} pageIndex
   * @param {number} pageSize
   */
  static async searchBooksByAI(args = {}, pageIndex = 1, pageSize = 10) {
    const params = {
      page: parseInt(pageIndex),
      limit: parseInt(pageSize),
      status: 'available' // Chỉ yêu cầu sách khả dụng, bỏ qua cooperation_status để tránh lọc nhầm DB test
    };

    // Map args từ AI → params của PublicationService.getAll()
    if (args.title)            params.title = args.title;
    if (args.author)           params.author = args.author;
    if (args.subject)          params.subject = args.subject;
    if (args.publisher)        params.search = args.publisher; // search trong nhiều field
    if (args.year_from)        params.year_from = parseInt(args.year_from);
    if (args.year_to)          params.year_to = parseInt(args.year_to);
    if (args.media_type)       params.media_type = args.media_type;
    if (args.sort_by)          params.sort_by = args.sort_by;

    // Tổng hợp keywords vào trường search nếu chưa có search
    if (args.keywords?.length > 0 && !params.title && !params.search) {
      const stopWords = ['tìm', 'sách', 'tài', 'liệu', 'quyển', 'cuốn', 'giúp', 'tôi', 'muốn', 'có', 'không'];
      const rawText = args.keywords.join(' ').toLowerCase();
      const cleanKeywords = rawText.split(/\s+/).filter(w => !stopWords.includes(w));
      params.search = cleanKeywords.join(' ').trim() || rawText; // Fallback to rawText if empty
    }

    const result = await PublicationService.getAll(params);

    return {
      items: result.publications,
      totalRecords: result.pagination.totalItems,
      totalPages: result.pagination.totalPages,
      pageIndex: parseInt(pageIndex),
      pageSize: parseInt(pageSize)
    };
  }

  /**
   * Tìm kiếm cơ bản — Không dùng AI, query thẳng
   * @param {string} query
   * @param {object} filters — { title, author, year_from, year_to, media_type, sort_by }
   */
  static async searchBasic(query = '', filters = {}, pageIndex = 1, pageSize = 10) {
    return this.searchBooksByAI(
      {
        ...filters,
        keywords: query ? [query] : []
      },
      pageIndex,
      pageSize
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // SEARCH NEWS — Tin tức thư viện
  // ─────────────────────────────────────────────────────────────────

  /**
   * Tìm kiếm tin tức từ args của Gemini Function Calling
   */
  static async searchNewsByAI(args = {}, pageIndex = 1, pageSize = 10) {
    const limit = parseInt(pageSize);
    const offset = (parseInt(pageIndex) - 1) * limit;
    const finalParams = ['published'];
    const finalConditions = ['n.status = $1'];

    if (args.keywords?.length > 0) {
      const stopWords = ['tìm', 'tin', 'tức', 'mới', 'nhất', 'bài', 'viết', 'đọc', 'cho', 'tôi', 'về', 'xem'];
      const rawText = args.keywords.join(' ').toLowerCase();
      const cleanKeywords = rawText.split(/\s+/).filter(w => !stopWords.includes(w));
      
      if (cleanKeywords.length > 0) {
        const kwGroup = [];
        cleanKeywords.forEach(kw => {
          finalParams.push(`%${kw}%`);
          const idx = finalParams.length;
          kwGroup.push(`n.title::text ILIKE $${idx}`);
          kwGroup.push(`n.summary::text ILIKE $${idx}`);
          kwGroup.push(`n.content::text ILIKE $${idx}`);
        });
        if (kwGroup.length > 0) {
          finalConditions.push(`(${kwGroup.join(' OR ')})`);
        }
      }
    }

    if (args.category) {
      finalParams.push(`%${args.category}%`);
      finalConditions.push(`(n.category_code ILIKE $${finalParams.length})`);
    }

    const whereClause = `WHERE ${finalConditions.join(' AND ')}`;

    // Count total
    const countQuery = `
      SELECT COUNT(*) FROM news n
      ${whereClause}
    `;
    const { rows: countRows } = await pool.query(countQuery, finalParams);
    const totalRecords = parseInt(countRows[0].count);

    // Data query
    finalParams.push(limit, offset);
    const dataQuery = `
      SELECT n.id, n.title, n.slug, n.summary, n.image_url,
             n.author, n.published_date, n.category_code
      FROM news n
      ${whereClause}
      ORDER BY n.published_date DESC
      LIMIT $${finalParams.length - 1} OFFSET $${finalParams.length}
    `;
    const { rows } = await pool.query(dataQuery, finalParams);

    const items = rows.map(r => ({
      ...r,
      category_name: r.category_code || 'Tin tức', // Đảm bảo trường r.category_name không bị undefined
      title: this._parseTitle(r.title),
      summary: this._parseTitle(r.summary)
    }));

    return {
      items,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      pageIndex: parseInt(pageIndex),
      pageSize: limit
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // AUTOCOMPLETE — Gợi ý nhanh khi gõ (không dùng AI)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Gợi ý autocomplete theo title + author (DB search, ~50ms)
   * @param {string} query — Từ đang gõ (tối thiểu 2 ký tự)
   * @param {number} limit — Tối đa số gợi ý trả về
   */
  static async autocomplete(query, limit = 8) {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim();
    const { rows } = await pool.query(`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.cover_image as thumbnail,
        b.media_type,
        b.publication_year
      FROM books b
      WHERE b.status = 'available'
        AND (
          b.title::text ILIKE $1
          OR b.author ILIKE $1
          OR b.isbn ILIKE $1
          OR b.code ILIKE $1
        )
      ORDER BY
        CASE WHEN b.title::text ILIKE $2 THEN 0 ELSE 1 END,
        b.publication_year DESC,
        b.id DESC
      LIMIT $3
    `, [`%${q}%`, `${q}%`, parseInt(limit)]);

    return rows.map(r => ({
      id: r.id,
      label: this._parseTitle(r.title),
      subtitle: r.author || '',
      thumbnail: r.thumbnail || null,
      year: r.publication_year,
      type: r.media_type
    }));
  }

  // ─────────────────────────────────────────────────────────────────
  // BARCODE / QR — Quét mã tra cứu
  // ─────────────────────────────────────────────────────────────────

  /**
   * Tìm ấn phẩm theo barcode
   * @param {string} barcode
   */
  static async searchByBarcode(barcode) {
    const { rows } = await pool.query(
      'SELECT publication_id FROM publication_copies WHERE barcode = $1 LIMIT 1',
      [barcode]
    );
    if (rows.length === 0) return null;
    return await PublicationService.getPublicationDetail(rows[0].publication_id);
  }
}

module.exports = SearchService;
