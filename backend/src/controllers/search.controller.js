const GeminiService = require('../services/gemini.service');
const SearchService = require('../services/search.service');

/**
 * Search Controller — Tìm kiếm thư viện cho Mobile App
 *
 * Endpoints:
 *  POST /api/public/search/ai-smart       ← Tìm kiếm thông minh (Gemini Function Calling)
 *  GET  /api/public/search/autocomplete   ← Gợi ý nhanh khi gõ (DB, không AI)
 *  GET  /api/public/search/publications   ← Tìm kiếm cơ bản / nâng cao (giữ nguyên)
 *  GET  /api/public/search/barcode/:code  ← Quét mã (giữ nguyên)
 *  GET  /api/public/search/ai-suggest     ← Legacy (backward compat)
 *  GET  /api/public/search/ai-news-suggest← Legacy (backward compat)
 */

// ─────────────────────────────────────────────────────────────────
// ✨ MỚI: Tìm kiếm thông minh bằng Gemini Function Calling
// POST /api/public/search/ai-smart
// Body: { query, pageIndex?, pageSize? }
// ─────────────────────────────────────────────────────────────────
exports.aiSmartSearch = async (req, res, next) => {
  try {
    const { query = '', pageIndex = 1, pageSize = 10 } = req.body;

    // Validate
    if (!query || query.trim().length < 2) {
      return res.json({
        code: 0, errorId: null, appId: null,
        success: true,
        message: 'Vui lòng nhập từ khóa tìm kiếm (tối thiểu 2 ký tự)',
        data: {
          type: 'books',
          items: [],
          totalRecords: 0,
          totalPages: 0,
          pageIndex: 1,
          pageSize: parseInt(pageSize),
          ai_interpreted: null
        },
        errors: null
      });
    }

    const trimmedQuery = query.trim();

    // 1. Gọi Gemini Function Calling — AI phân tích intent
    const geminiResult = await GeminiService.functionCallSearch(trimmedQuery);

    // 2. Execute function tương ứng mà AI chọn
    let searchResult;
    let resultType;

    if (geminiResult.function === 'searchNews') {
      const finalLimit = geminiResult.args.limit || pageSize;
      searchResult = await SearchService.searchNewsByAI(
        geminiResult.args,
        pageIndex,
        finalLimit
      );
      resultType = 'news';
    } else {
      // Default: searchBooks
      const finalLimit = geminiResult.args.limit || pageSize;
      searchResult = await SearchService.searchBooksByAI(
        geminiResult.args,
        pageIndex,
        finalLimit
      );
      resultType = 'books';
    }

    return res.json({
      code: 0, errorId: null, appId: null,
      success: true,
      message: 'Tìm kiếm thông minh thành công',
      data: {
        type: resultType,
        ...searchResult,
        ai_interpreted: {
          function: geminiResult.function,
          params: geminiResult.args,
          originalQuery: trimmedQuery
        }
      },
      errors: null
    });

  } catch (error) {
    // Fallback an toàn: nếu AI hoặc DB lỗi → tìm kiếm cơ bản
    console.error('[SearchController] aiSmartSearch error, falling back:', error.message);
    try {
      const { query = '', pageIndex = 1, pageSize = 10 } = req.body;
      const searchResult = await SearchService.searchBooksByAI(
        { keywords: [query.trim()] },
        pageIndex,
        pageSize
      );
      return res.json({
        code: 0, errorId: null, appId: null,
        success: true,
        message: 'Tìm kiếm cơ bản (AI tạm thời không khả dụng)',
        data: {
          type: 'books',
          ...searchResult,
          ai_interpreted: null
        },
        errors: null
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

    return res.json({
      code: 0, errorId: null, appId: null,
      success: true,
      message: 'Gợi ý tìm kiếm',
      data: suggestions,
      errors: null
    });
  } catch (error) {
    return next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GIỮ NGUYÊN: Tìm kiếm cơ bản & nâng cao
// GET /api/public/search/publications
// (Đã có trong public_search.controller.js — export lại từ đây để routes gọn)
// ─────────────────────────────────────────────────────────────────
const publicSearchController = require('./public_search.controller');
exports.searchPublications = publicSearchController.searchPublications;
exports.searchByBarcode    = publicSearchController.searchByBarcode;

// (Đã dọn dẹp các API legacy aiSuggest và aiNewsSuggest)
