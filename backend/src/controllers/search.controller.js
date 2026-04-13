const GeminiService = require('../services/gemini.service');
const SearchService = require('../services/search.service');

const stripVietnamese = (input = '') =>
  String(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

const QUERY_NOISE_PREFIXES = [
  /^tr[ií]ch\s*xu[aấ]t\s*t[ừu]\s*kh[oó]a\s*t[iì]m\s*ki[ếe]m\s*ch[ií]nh\s*x[aá]c\s*:?\s*/i,
  /^trich\s*xuat\s*tu\s*khoa\s*tim\s*kiem\s*chinh\s*xac\s*:?\s*/i,
  /^extract\s*(the\s*)?(search\s*)?keywords?\s*:?\s*/i,
  /^keyword\s*extraction\s*:?\s*/i,
];

const QUERY_NOISE_WORDS = new Set([
  'trich', 'xuat', 'tu', 'khoa', 'tim', 'kiem', 'chinh', 'xac',
  'toi', 'toi?', 've', 'sach', 'cuon', 'quyen', 'cho', 'muon', 'can',
  'hay', 'giup', 'phan', 'tich', 'chinhxac', 'keyword', 'extract'
]);

const normalizeSmartQuery = (raw = '') => {
  let text = String(raw || '').trim();
  if (!text) return '';

  for (const rx of QUERY_NOISE_PREFIXES) {
    text = text.replace(rx, '');
  }

  const colonIndex = text.indexOf(':');
  if (colonIndex > -1) {
    const left = stripVietnamese(text.slice(0, colonIndex).toLowerCase());
    if (left.includes('tu khoa') || left.includes('keyword') || left.includes('tim kiem')) {
      text = text.slice(colonIndex + 1).trim();
    }
  }

  text = text.replace(/^['"“”‘’]+|['"“”‘’]+$/g, '').replace(/\s+/g, ' ').trim();
  return text;
};

const sanitizeKeywords = (value) => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  const out = [];

  for (const item of list) {
    const normalizedQuery = normalizeSmartQuery(item);
    const clean = String(normalizedQuery || '')
      .replace(/[.,;:!?()[\]{}<>|/\\+\-=*^%$#@~`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) continue;

    const tokens = clean
      .split(' ')
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => {
        const k = stripVietnamese(t.toLowerCase());
        return !QUERY_NOISE_WORDS.has(k);
      });

    const phrase = tokens.join(' ').trim();
    if (phrase) out.push(phrase);
  }

  return [...new Set(out)];
};

const normalizeGeminiArgs = (fnName, args = {}, query = '') => {
  const safe = { ...(args || {}) };
  const fallbackKeywords = sanitizeKeywords(query);
  const mergedKeywords = sanitizeKeywords([
    ...(Array.isArray(safe.keywords) ? safe.keywords : []),
    safe.title,
    safe.subject,
    safe.author,
    query,
  ]);

  if (fnName === 'searchNews') {
    safe.keywords = mergedKeywords.length > 0 ? mergedKeywords : fallbackKeywords;
    return safe;
  }

  // Default searchBooks
  safe.keywords = mergedKeywords.length > 0 ? mergedKeywords : fallbackKeywords;
  if (safe.title) safe.title = normalizeSmartQuery(safe.title);
  if (safe.subject) safe.subject = normalizeSmartQuery(safe.subject);
  if (safe.author) safe.author = normalizeSmartQuery(safe.author);
  return safe;
};

// Helper để tạo response chuẩn 7 trường
const sendResponse = (res, status, message, data = null, errors = null, pagination = null) => {
  const response = {
    code: status === 200 || status === 201 ? 0 : status, // Tuân thủ code: 0 cho success theo yêu cầu User
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

/**
 * Search Controller — Tìm kiếm thư viện cho Mobile App
 */

// ─────────────────────────────────────────────────────────────────
// ✨ MỚI: Tìm kiếm thông minh bằng Gemini Function Calling
// POST /api/public/search/ai-smart
// ─────────────────────────────────────────────────────────────────
exports.aiSmartSearch = async (req, res, next) => {
  try {
    const { query = '', pageIndex = 1, pageSize = 10 } = req.body;

    // Validate
    if (!query || query.trim().length < 2) {
      return sendResponse(res, 200, 'Vui lòng nhập từ khóa tìm kiếm (tối thiểu 2 ký tự)', {
        type: 'books',
        items: [],
        totalRecords: 0,
        totalPages: 0,
        pageIndex: 1,
        pageSize: parseInt(pageSize),
        ai_interpreted: null
      });
    }

    const trimmedQuery = query.trim();
    const normalizedQuery = normalizeSmartQuery(trimmedQuery) || trimmedQuery;

    // 1. Gọi Gemini Function Calling — AI phân tích intent
    const geminiResult = await GeminiService.functionCallSearch(normalizedQuery);
    const normalizedArgs = normalizeGeminiArgs(geminiResult.function, geminiResult.args, normalizedQuery);

    // 2. Execute function tương ứng mà AI chọn
    let searchResult;
    let resultType;

    if (geminiResult.function === 'searchNews') {
      const finalLimit = normalizedArgs.limit || pageSize;
      searchResult = await SearchService.searchNewsByAI(
        normalizedArgs,
        pageIndex,
        finalLimit
      );
      resultType = 'news';
    } else {
      // Default: searchBooks
      const finalLimit = normalizedArgs.limit || pageSize;
      searchResult = await SearchService.searchBooksByAI(
        normalizedArgs,
        pageIndex,
        finalLimit
      );
      resultType = 'books';
    }

    return sendResponse(res, 200, 'Tìm kiếm thông minh thành công', {
      type: resultType,
      ...searchResult,
      ai_interpreted: {
        function: geminiResult.function,
        params: normalizedArgs,
        originalQuery: normalizedQuery,
        rawQuery: trimmedQuery,
        strategy: {
          mode: 'function-calling+rerank',
          stages: ['normalize-query', 'function-call', 'sanitize-args', 'hybrid-retrieve', 'intent-rerank']
        }
      }
    });

  } catch (error) {
    // Fallback an toàn: nếu AI hoặc DB lỗi → tìm kiếm cơ bản
    console.error('[SearchController] aiSmartSearch error, falling back:', error.message);
    try {
      const { query = '', pageIndex = 1, pageSize = 10 } = req.body;
      const normalizedQuery = normalizeSmartQuery(query?.trim?.() || query || '');
      const searchResult = await SearchService.searchBooksByAI(
        { keywords: sanitizeKeywords(normalizedQuery || query) },
        pageIndex,
        pageSize
      );
      return sendResponse(res, 200, 'Tìm kiếm cơ bản (AI tạm thời không khả dụng)', {
        type: 'books',
        ...searchResult,
        ai_interpreted: null
      });
    } catch (fallbackError) {
      return next(fallbackError);
    }
  }
};

// ─────────────────────────────────────────────────────────────────
// ✨ MỚI: Gợi ý Autocomplete (nhanh, không AI)
// GET /api/public/search/autocomplete?q=python&limit=8
// ─────────────────────────────────────────────────────────────────
exports.autocomplete = async (req, res, next) => {
  try {
    const { q = '', limit = 8 } = req.query;

    const suggestions = await SearchService.autocomplete(q, limit);

    return sendResponse(res, 200, 'Gợi ý tìm kiếm', suggestions);
  } catch (error) {
    return next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GOI TIN TUC: Goi y tin tuc bang tu khoa (khong can body)
// GET /api/public/search/ai-news-suggest?query=...
// ─────────────────────────────────────────────────────────────────
exports.aiNewsSuggest = async (req, res, next) => {
  try {
    const { query = '', pageIndex = 1, pageSize = 10 } = req.query;
    const safePage = Math.max(parseInt(pageIndex, 10) || 1, 1);
    const safeSize = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 50);
    const trimmedQuery = (query || '').trim();

    if (!trimmedQuery) {
      return sendResponse(res, 200, 'Danh sách tin tức', [], null, {
        page: safePage,
        limit: safeSize,
        total: 0,
        totalItems: 0,
        totalPages: 0,
        currentPage: safePage
      });
    }

    const result = await SearchService.searchNewsByAI(
      { keywords: [trimmedQuery] },
      safePage,
      safeSize
    );

    return res.status(200).json({
      code: 0,
      success: true,
      message: 'Gợi ý tin tức thành công',
      data: result.items,
      errorId: null,
      appId: null,
      errors: null,
      pagination: {
        page: result.pageIndex,
        limit: result.pageSize,
        total: result.totalRecords,
        totalItems: result.totalRecords,
        totalPages: result.totalPages,
        currentPage: result.pageIndex
      },
      ai_interpreted: {
        function: 'searchNews',
        params: { keywords: [trimmedQuery] },
        originalQuery: trimmedQuery
      }
    });
  } catch (error) {
    return next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GIỮ NGUYÊN: Tìm kiếm cơ bản & nâng cao
// ─────────────────────────────────────────────────────────────────
const publicSearchController = require('./public_search.controller');
exports.searchPublications = publicSearchController.searchPublications;
exports.searchByBarcode    = publicSearchController.searchByBarcode;

// (Đã dọn dẹp các API legacy aiSuggest)
