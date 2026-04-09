const GeminiService = require('../services/gemini.service');
const SearchService = require('../services/search.service');

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

    return sendResponse(res, 200, 'Tìm kiếm thông minh thành công', {
      type: resultType,
      ...searchResult,
      ai_interpreted: {
        function: geminiResult.function,
        params: geminiResult.args,
        originalQuery: trimmedQuery
      }
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
// GIỮ NGUYÊN: Tìm kiếm cơ bản & nâng cao
// ─────────────────────────────────────────────────────────────────
const publicSearchController = require('./public_search.controller');
exports.searchPublications = publicSearchController.searchPublications;
exports.searchByBarcode    = publicSearchController.searchByBarcode;

// (Đã dọn dẹp các API legacy aiSuggest và aiNewsSuggest)
