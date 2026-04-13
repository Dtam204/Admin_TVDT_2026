const { pool } = require('../config/database');
const PublicationService = require('./admin/publication.service');

/**
 * SearchService — Tập trung toàn bộ logic tìm kiếm cho Mobile App
 * Tách biệt khỏi controller để tái sử dụng và dễ test.
 */
class SearchService {
  static BOOK_SEARCH_STOP_WORDS = new Set([
    'tim', 'tìm', 'kiem', 'kiếm', 'sach', 'sách', 'tai', 'tài', 'lieu', 'liệu', 'tai_lieu',
    'quyen', 'quyển', 'cuon', 'cuốn', 've', 'về', 'cho', 'toi', 'tôi', 'muon', 'muốn',
    'can', 'cần', 'co', 'có', 'khong', 'không', 'nhe', 'nhé', 'giup', 'giúp', 'di', 'đi',
    'la', 'là', 'nhung', 'những', 'cac', 'các', 'mot', 'một', 'the', 'thể', 'loai', 'loại',
    'duoc', 'được', 'dang', 'đang', 'nay', 'này', 'do', 'đó', 'o', 'ở', 'tu', 'từ', 'den', 'đến'
  ]);

  static BOOK_INTENT_PROGRAMMING_TERMS = new Set([
    'lap', 'trinh', 'programming', 'python', 'java', 'javascript', 'typescript', 'cpp', 'csharp',
    'php', 'golang', 'sql', 'database', 'algorithm', 'coding', 'developer'
  ]);

  static BOOK_INTENT_LITERATURE_TERMS = new Set([
    'van', 'hoc', 'truyen', 'tieu', 'thuyet', 'tho', 'comic', 'manga', 'conan', 'doraemon', 'novel'
  ]);

  static BOOK_QUERY_GENERIC_TOKENS = new Set([
    'lap', 'trinh', 'programming', 'coding', 'sach', 'book', 'nguoi', 'moi', 'co', 'ban', 'nhap', 'mon'
  ]);

  static _stripVietnamese(input = '') {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  static _normalizeToken(input = '') {
    return this._stripVietnamese(String(input).toLowerCase().trim());
  }

  static _cleanPhrase(input = '') {
    if (!input) return '';
    const text = String(input)
      .replace(/["'“”‘’]/g, ' ')
      .replace(/[_.,;:!?()[\]{}<>|/\\+\-=*^%$#@~`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) return '';

    const tokens = text
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => {
        const normalized = this._normalizeToken(part);
        if (!normalized || normalized.length < 2) return false;
        return !this.BOOK_SEARCH_STOP_WORDS.has(normalized);
      });

    return tokens.join(' ').trim();
  }

  static _collectBookSearchCandidates(args = {}) {
    const rawInputs = [];
    if (args.title) rawInputs.push(args.title);
    if (args.subject) rawInputs.push(args.subject);
    if (args.author) rawInputs.push(args.author);
    if (args.publisher) rawInputs.push(args.publisher);

    if (Array.isArray(args.keywords)) {
      for (const kw of args.keywords) {
        if (kw) rawInputs.push(kw);
      }
    }

    const cleanedPhrases = [];
    const cleanedTokens = [];

    for (const raw of rawInputs) {
      const cleaned = this._cleanPhrase(raw);
      if (!cleaned) continue;
      cleanedPhrases.push(cleaned);
      for (const token of cleaned.split(' ')) {
        if (token.length >= 2) cleanedTokens.push(token);
      }
    }

    const uniquePhrases = [...new Set(cleanedPhrases)];
    const uniqueTokens = [...new Set(cleanedTokens)];

    const candidates = [];

    // 1) Ưu tiên cụm từ đầy đủ mà AI trích xuất được (vd: "tâm lý học")
    for (const phrase of uniquePhrases) {
      candidates.push(phrase);
    }

    // 2) Nếu nhiều token, thử ghép top token thành cụm chính
    if (uniqueTokens.length > 1) {
      candidates.push(uniqueTokens.slice(0, 4).join(' '));
      candidates.push(uniqueTokens.slice(0, 3).join(' '));
      candidates.push(uniqueTokens.slice(0, 2).join(' '));
    }

    // 3) Cuối cùng thử từng token để tăng recall
    for (const token of uniqueTokens) {
      candidates.push(token);
    }

    return [...new Set(candidates)].filter(Boolean);
  }
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

  static _safeText(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      if (val.vi || val.en || val.text) return String(val.vi || val.en || val.text || '');
      try {
        return JSON.stringify(val);
      } catch {
        return '';
      }
    }
    return String(val);
  }

  static _toSearchText(input = '') {
    return this._stripVietnamese(this._safeText(input).toLowerCase())
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static _tokenize(input = '') {
    return this._toSearchText(input)
      .split(' ')
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
  }

  static _extractQueryTokens(args = {}) {
    const merged = [
      args.title,
      args.author,
      args.subject,
      Array.isArray(args.keywords) ? args.keywords.join(' ') : ''
    ].filter(Boolean).join(' ');

    const phrase = this._cleanPhrase(merged);
    if (!phrase) return [];
    return [...new Set(this._tokenize(phrase))];
  }

  static _detectBookIntent(args = {}) {
    const tokens = this._extractQueryTokens(args);
    if (tokens.length === 0) {
      return { isProgrammingIntent: false, isLiteratureIntent: false };
    }

    const isProgrammingIntent = tokens.some((t) => this.BOOK_INTENT_PROGRAMMING_TERMS.has(t));
    const isLiteratureIntent = tokens.some((t) => this.BOOK_INTENT_LITERATURE_TERMS.has(t));
    return { isProgrammingIntent, isLiteratureIntent };
  }

  static _extractCoreTokens(args = {}, intent = { isProgrammingIntent: false, isLiteratureIntent: false }) {
    const tokens = this._extractQueryTokens(args);
    if (tokens.length === 0) return [];

    const filtered = tokens.filter((t) => {
      if (!t || t.length < 3) return false;
      if (this.BOOK_QUERY_GENERIC_TOKENS.has(t)) return false;
      if (this.BOOK_SEARCH_STOP_WORDS.has(t)) return false;
      return true;
    });

    // Nếu query quá ngắn/ít đặc trưng, fallback giữ lại token gốc để không lọc quá tay.
    if (filtered.length === 0) return tokens.slice(0, 4);

    if (intent.isProgrammingIntent) {
      const prioritized = filtered.filter((t) => this.BOOK_INTENT_PROGRAMMING_TERMS.has(t));
      return [...new Set([...prioritized, ...filtered])];
    }

    if (intent.isLiteratureIntent) {
      const prioritized = filtered.filter((t) => this.BOOK_INTENT_LITERATURE_TERMS.has(t));
      return [...new Set([...prioritized, ...filtered])];
    }

    return [...new Set(filtered)];
  }

  static _scoreBookResult(
    book = {},
    args = {},
    candidates = [],
    intent = { isProgrammingIntent: false, isLiteratureIntent: false },
    coreTokens = []
  ) {
    const title = this._toSearchText(this._parseTitle(book.title));
    const author = this._toSearchText(book.author || book.authors_list?.map((a) => a?.name).filter(Boolean).join(' '));
    const description = this._toSearchText(book.description);
    const keywords = this._toSearchText(Array.isArray(book.keywords) ? book.keywords.join(' ') : book.keywords);
    const haystack = `${title} ${author} ${description} ${keywords}`.trim();

    let score = 0;
    let matchedSignals = 0;

    const normalizedTitle = this._toSearchText(args.title || '');
    const normalizedAuthor = this._toSearchText(args.author || '');
    const normalizedSubject = this._toSearchText(args.subject || '');

    if (normalizedTitle) {
      if (title === normalizedTitle) {
        score += 160;
        matchedSignals += 1;
      } else if (title.startsWith(normalizedTitle)) {
        score += 130;
        matchedSignals += 1;
      } else if (title.includes(normalizedTitle)) {
        score += 95;
        matchedSignals += 1;
      }
    }

    if (normalizedAuthor) {
      if (author.includes(normalizedAuthor)) {
        score += 90;
        matchedSignals += 1;
      }
    }

    if (normalizedSubject) {
      if (haystack.includes(normalizedSubject)) {
        score += 55;
        matchedSignals += 1;
      }
    }

    for (const candidate of candidates) {
      const c = this._toSearchText(candidate);
      if (!c) continue;

      if (title.includes(c)) score += 42;
      else if (author.includes(c)) score += 28;
      else if (haystack.includes(c)) score += 16;
    }

    const queryTokens = [
      ...this._tokenize(args.title),
      ...this._tokenize(args.author),
      ...this._tokenize(args.subject),
      ...this._tokenize(Array.isArray(args.keywords) ? args.keywords.join(' ') : '')
    ];

    const uniqueTokens = [...new Set(queryTokens)];
    let matchedTokens = 0;
    for (const t of uniqueTokens) {
      if (title.includes(t)) {
        score += 10;
        matchedTokens += 1;
      } else if (author.includes(t)) {
        score += 8;
        matchedTokens += 1;
      } else if (haystack.includes(t)) {
        score += 4;
        matchedTokens += 1;
      }
    }

    const uniqueCoreTokens = [...new Set(coreTokens.filter(Boolean))];
    let matchedCoreTokens = 0;
    for (const t of uniqueCoreTokens) {
      if (title.includes(t)) {
        score += 18;
        matchedCoreTokens += 1;
      } else if (keywords.includes(t)) {
        score += 13;
        matchedCoreTokens += 1;
      } else if (description.includes(t) || haystack.includes(t)) {
        score += 8;
        matchedCoreTokens += 1;
      }
    }

    let domainMatch = null;
    if (intent.isProgrammingIntent) {
      const hasProgrammingSignal = [...this.BOOK_INTENT_PROGRAMMING_TERMS].some((term) => haystack.includes(term));
      const hasLiteratureSignal = [...this.BOOK_INTENT_LITERATURE_TERMS].some((term) => haystack.includes(term));
      if (hasProgrammingSignal) {
        score += 45;
        domainMatch = true;
      } else if (hasLiteratureSignal) {
        score -= 130;
        domainMatch = false;
      } else {
        score -= 90;
        domainMatch = false;
      }
    } else if (intent.isLiteratureIntent) {
      const hasLiteratureSignal = [...this.BOOK_INTENT_LITERATURE_TERMS].some((term) => haystack.includes(term));
      const hasProgrammingSignal = [...this.BOOK_INTENT_PROGRAMMING_TERMS].some((term) => haystack.includes(term));
      if (hasLiteratureSignal) {
        score += 35;
        domainMatch = true;
      } else if (hasProgrammingSignal) {
        score -= 95;
        domainMatch = false;
      } else {
        score -= 60;
        domainMatch = false;
      }
    }

    if (Number.isFinite(book.average_rating)) {
      score += Math.min(Number(book.average_rating || 0) * 2, 10);
    }

    return { score, matchedSignals, matchedTokens, matchedCoreTokens, domainMatch };
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
    const requestedPage = Math.max(parseInt(pageIndex, 10) || 1, 1);
    const requestedSize = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 50);
    const retrievalLimit = Math.min(Math.max(requestedSize * 6, 40), 120);

    const baseParams = {
      page: 1,
      limit: retrievalLimit,
      status: 'available' // Chỉ yêu cầu sách khả dụng, bỏ qua cooperation_status để tránh lọc nhầm DB test
    };

    // Map args từ AI → params của PublicationService.getAll()
    if (args.title)            baseParams.title = this._cleanPhrase(args.title) || args.title;
    if (args.author)           baseParams.author = this._cleanPhrase(args.author) || args.author;
    if (args.subject)          baseParams.subject = this._cleanPhrase(args.subject) || args.subject;
    if (args.year_from)        baseParams.year_from = parseInt(args.year_from);
    if (args.year_to)          baseParams.year_to = parseInt(args.year_to);
    if (args.media_type)       baseParams.media_type = args.media_type;
    if (args.sort_by)          baseParams.sort_by = args.sort_by;

    // Nếu có publisher, ưu tiên đưa vào danh sách candidate để thử tìm mềm theo nhiều field.
    const candidates = this._collectBookSearchCandidates(args);

    // Retrieve stage 1: truy vấn có cấu trúc theo args.
    let result = await PublicationService.getAll(baseParams);

    // Retrieve stage 2: mở rộng recall bằng candidate phrases rồi gom unique.
    const bucket = new Map();
    const pushPublications = (list = []) => {
      for (const p of list) {
        if (p && p.id && !bucket.has(p.id)) bucket.set(p.id, p);
      }
    };

    pushPublications(result.publications || []);

    const expansionCandidates = candidates.slice(0, 6);
    for (const candidate of expansionCandidates) {
      if (bucket.size >= retrievalLimit) break;
      const tryParams = { ...baseParams, search: candidate, title: undefined, author: undefined, subject: undefined };
      const tryResult = await PublicationService.getAll(tryParams);
      pushPublications(tryResult.publications || []);
    }

    // Rerank stage: chấm điểm theo ý định (title/author/subject + keyword signals).
    const intent = this._detectBookIntent(args);
    const queryTokens = this._extractQueryTokens(args);
    const coreTokens = this._extractCoreTokens(args, intent);
    let reranked = Array.from(bucket.values()).map((book) => {
      const scored = this._scoreBookResult(book, args, candidates, intent, coreTokens);
      return {
        ...book,
        _searchScore: scored.score,
        _matchedSignals: scored.matchedSignals,
        _matchedTokens: scored.matchedTokens,
        _matchedCoreTokens: scored.matchedCoreTokens,
        _domainMatch: scored.domainMatch
      };
    });

    reranked.sort((a, b) => {
      if ((b._searchScore || 0) !== (a._searchScore || 0)) return (b._searchScore || 0) - (a._searchScore || 0);
      const byRating = Number(b.average_rating || 0) - Number(a.average_rating || 0);
      if (byRating !== 0) return byRating;
      return Number(b.id || 0) - Number(a.id || 0);
    });

    // Relevance gate: loại kết quả quá lệch ý định để tránh trả về "mọi thứ có sẵn".
    const hasQuerySignals = queryTokens.length > 0;
    if (hasQuerySignals) {
      const topScore = Number(reranked[0]?._searchScore || 0);
      const minScore = intent.isProgrammingIntent ? 28 : 16;
      const dynamicScoreCutoff = Math.max(minScore, Math.floor(topScore * (intent.isProgrammingIntent ? 0.34 : 0.26)));
      const minMatchedTokens = intent.isProgrammingIntent ? 1 : 0;
      const minMatchedCoreTokens = intent.isProgrammingIntent && coreTokens.length > 0 ? 1 : 0;

      let filtered = reranked.filter((book) => {
        const hasTokenMatch = Number(book._matchedTokens || 0) >= minMatchedTokens;
        const hasCoreTokenMatch = Number(book._matchedCoreTokens || 0) >= minMatchedCoreTokens;
        const hasSignalMatch = Number(book._matchedSignals || 0) > 0;
        const scorePass = Number(book._searchScore || 0) >= dynamicScoreCutoff;
        const coreCoverage = coreTokens.length > 0
          ? Number(book._matchedCoreTokens || 0) / coreTokens.length
          : 1;
        const coreCoveragePass = coreCoverage >= (intent.isProgrammingIntent ? 0.25 : 0.12);

        if (intent.isProgrammingIntent && book._domainMatch === false) return false;
        if (intent.isLiteratureIntent && book._domainMatch === false) return false;

        return (hasCoreTokenMatch && coreCoveragePass) || hasTokenMatch || hasSignalMatch || scorePass;
      });

      // Nếu lọc quá chặt làm rỗng dữ liệu, fallback về top kết quả đã rerank.
      if (filtered.length === 0 && reranked.length > 0) {
        filtered = reranked.slice(0, Math.min(requestedSize, reranked.length));
      }

      reranked = filtered;
    }

    const totalRecords = reranked.length;
    const totalPages = Math.ceil(totalRecords / requestedSize);
    const offset = (requestedPage - 1) * requestedSize;
    const items = reranked.slice(offset, offset + requestedSize).map((book) => {
      const { _searchScore, _matchedSignals, _matchedTokens, _matchedCoreTokens, _domainMatch, ...rest } = book;
      return rest;
    });

    return {
      items,
      totalRecords,
      totalPages,
      pageIndex: requestedPage,
      pageSize: requestedSize
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
