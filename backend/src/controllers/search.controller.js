const { pool } = require('../config/database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Cấu hình Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * AI Search: Sử dụng Gemini để phân tích ý định tìm kiếm
 * GET /api/public/search/ai-suggest?query=...
 */
exports.aiSuggest = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({ success: true, data: [], message: "Vui lòng nhập từ khóa tìm kiếm" });
    }

    // 1. Dùng Gemini để trích xuất từ khóa/intent
    const prompt = `
      Bạn là trợ lý tìm kiếm thông minh cho thư viện. 
      Nhiệm vụ: Phân tích yêu cầu tìm kiếm của người dùng và trả về JSON chứa các tiêu chí lọc.
      Yêu cầu của người dùng: "${query}"

      Hãy trả về JSON theo định dạng sau (chỉ trả về JSON, không giải thích thêm):
      {
        "title": "tên sách nếu có",
        "author": "tên tác giả nếu có",
        "category": "thể loại nếu có",
        "keywords": ["từ khóa 1", "từ khóa 2"],
        "intent": "search_books"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON từ AI
    let aiCriteria = { keywords: [query] };
    try {
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0];
      if (jsonStr) {
        aiCriteria = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.error("AI Parse Error:", e);
    }

    // 2. Xây dựng câu truy vấn Database dựa trên criteria của AI
    const searchParams = [];
    const conditions = [];

    if (aiCriteria.title) {
      searchParams.push(`%${aiCriteria.title}%`);
      conditions.push(`b.title::text ILIKE $${searchParams.length}`);
    }

    if (aiCriteria.author) {
      searchParams.push(`%${aiCriteria.author}%`);
      conditions.push(`b.author::text ILIKE $${searchParams.length}`);
    }

    if (aiCriteria.category) {
      searchParams.push(`%${aiCriteria.category}%`);
      conditions.push(`c.name::text ILIKE $${searchParams.length}`);
    }

    // Nếu AI gợi ý từ khóa, tìm kiếm trong title hoặc description
    if (aiCriteria.keywords && aiCriteria.keywords.length > 0) {
      aiCriteria.keywords.forEach(kw => {
        searchParams.push(`%${kw}%`);
        conditions.push(`(b.title::text ILIKE $${searchParams.length} OR b.description::text ILIKE $${searchParams.length})`);
      });
    }

    // Nếu không có filter nào từ AI, fallback tìm kiếm cơ bản theo query gốc
    if (conditions.length === 0) {
      searchParams.push(`%${query}%`);
      conditions.push(`(b.title::text ILIKE $${searchParams.length} OR b.author::text ILIKE $${searchParams.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' OR ')}` : '';

    const sqlQuery = `
      SELECT DISTINCT 
        b.id, b.title, b.cover_image as thumbnail, b.author, 
        b.publication_year, b.dominant_color, b.is_digital,
        c.name as category_name
      FROM books b
      LEFT JOIN book_category_books bcb ON b.id = bcb.book_id
      LEFT JOIN book_categories c ON bcb.category_id = c.id
      ${whereClause}
      LIMIT 10
    `;

    const { rows } = await pool.query(sqlQuery, searchParams);

    // Xử lý title (parse từ jsonb nếu cần)
    const processedRows = rows.map(r => {
      let finalTitle = r.title;
      if (typeof r.title === 'string' && r.title.startsWith('{')) {
        try {
          const parsed = JSON.parse(r.title);
          finalTitle = parsed.vi || parsed.en || r.title;
        } catch(e){}
      } else if (r.title && typeof r.title === 'object') {
        finalTitle = r.title.vi || r.title.en || "Chưa có tiêu đề";
      }
      return { ...r, title: finalTitle };
    });

    res.json({
      success: true,
      data: processedRows,
      ai_interpreted: aiCriteria
    });

  } catch (error) {
    next(error);
  }
};

/**
 * AI News Search: Sử dụng Gemini để phân tích ý định tìm kiếm tin tức
 * GET /api/public/search/ai-news-suggest?query=...
 */
exports.aiNewsSuggest = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({ success: true, data: [], message: "Vui lòng nhập từ khóa tìm kiếm" });
    }

    // 1. Dùng Gemini để trích xuất từ khóa/intent cho tin tức
    const prompt = `
      Bạn là trợ lý tìm kiếm thông minh cho trang tin tức của một thư viện/trường học. 
      Nhiệm vụ: Phân tích yêu cầu tìm kiếm của người dùng về TIN TỨC và trả về JSON chứa các tiêu chí lọc.
      Yêu cầu của người dùng: "${query}"

      Hãy trả về JSON theo định dạng sau (chỉ trả về JSON, không giải thích thêm):
      {
        "title": "từ khóa trong tiêu đề nếu có",
        "keywords": ["từ khóa 1", "từ khóa 2"],
        "intent": "search_news"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON từ AI
    let aiCriteria = { keywords: [query] };
    try {
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0];
      if (jsonStr) {
        aiCriteria = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.error("AI News Parse Error:", e);
    }

    // 2. Xây dựng câu truy vấn Database dựa trên criteria của AI cho bảng news
    const searchParams = [];
    const conditions = [];

    // Luôn chỉ tìm tin tức đã công bố
    conditions.push("n.status = 'published'");

    if (aiCriteria.title) {
      searchParams.push(`%${aiCriteria.title}%`);
      conditions.push(`n.title::text ILIKE $${searchParams.length + 1}`);
    }

    if (aiCriteria.category) {
      searchParams.push(`%${aiCriteria.category}%`);
      conditions.push(`(n.category_code ILIKE $${searchParams.length + 1} OR c.name ILIKE $${searchParams.length + 1})`);
    }

    // Nếu AI gợi ý từ khóa, tìm kiếm trong title, summary hoặc content
    if (aiCriteria.keywords && aiCriteria.keywords.length > 0) {
      const keywordConditions = [];
      aiCriteria.keywords.forEach(kw => {
        searchParams.push(`%${kw}%`);
        const pIndex = searchParams.length; // +1 vì params[0] là 'published' (nhưng ở đây searchParams bắt đầu từ rỗng, ta cộng vào sau)
        // Lưu ý: params trong query thực tế sẽ là [status, ...searchParams]
      });
      
      // Xây dựng lại logic index cho chính xác
      // Thực tế ta nên append 'published' vào searchParams luôn
    }

    // Viết lại logic query params cho chuẩn
    const finalParams = ['published'];
    const finalConditions = ["n.status = $1"];

    if (aiCriteria.title) {
      finalParams.push(`%${aiCriteria.title}%`);
      finalConditions.push(`n.title::text ILIKE $${finalParams.length}`);
    }

    if (aiCriteria.keywords && aiCriteria.keywords.length > 0) {
      const kwGroup = [];
      aiCriteria.keywords.forEach(kw => {
        finalParams.push(`%${kw}%`);
        kwGroup.push(`n.title::text ILIKE $${finalParams.length}`);
        kwGroup.push(`n.summary::text ILIKE $${finalParams.length}`);
        kwGroup.push(`n.content::text ILIKE $${finalParams.length}`);
      });
      if (kwGroup.length > 0) {
        finalConditions.push(`(${kwGroup.join(' OR ')})`);
      }
    }

    // Nếu không trích xuất được gì, fallback tìm query gốc
    if (finalParams.length === 1) {
      finalParams.push(`%${query}%`);
      finalConditions.push(`(n.title::text ILIKE $2 OR n.summary::text ILIKE $2)`);
    }

    const whereClause = `WHERE ${finalConditions.join(' AND ')}`;

    const sqlQuery = `
      SELECT 
        n.id, n.title, n.slug, n.summary, n.image_url, 
        n.author, n.published_date
      FROM news n
      ${whereClause}
      ORDER BY n.published_date DESC
      LIMIT 10
    `;

    const { rows } = await pool.query(sqlQuery, finalParams);

    // Xử lý title & summary (parse locale)
    const processedRows = rows.map(r => {
      const mapField = (field) => {
        if (typeof field === 'string' && field.startsWith('{')) {
          try {
            const parsed = JSON.parse(field);
            return parsed.vi || parsed.en || field;
          } catch(e) { return field; }
        }
        if (field && typeof field === 'object') {
          return field.vi || field.en || "";
        }
        return field;
      };

      return { 
        ...r, 
        title: mapField(r.title),
        summary: mapField(r.summary),
        excerpt: mapField(r.summary) // Đồng bộ cho Frontend
      };
    });

    res.json({
      success: true,
      data: processedRows,
      ai_interpreted: aiCriteria
    });

  } catch (error) {
    next(error);
  }
};
