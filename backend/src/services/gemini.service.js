const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * GeminiService — Tích hợp Google Gemini AI cho thư viện
 * Hỗ trợ: Tóm tắt, Phân tích tìm kiếm (Function Calling), Semantic Search
 */
class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      console.log('🚀 Gemini AI Service: API Key detected.');
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } else {
      console.error('❌ ERROR: GEMINI_API_KEY is missing in .env!');
      this.genAI = null;
      this.model = null;
    }
  }

  static _stripVietnamese(input = '') {
    return String(input)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  static _cleanKeywords(query = '') {
    const stopWords = new Set([
      'tim', 'kiem', 'sach', 'tin', 'tuc', 'toi', 've', 'cho', 'muon', 'can', 'hay', 'giup', 'phan', 'tich',
      'trich', 'xuat', 'tu', 'khoa', 'chinh', 'xac', 'extract', 'keyword', 'keywords'
    ]);
    const genericWords = new Set([
      'lap', 'trinh', 'nguoi', 'moi', 'co', 'ban', 'nhap', 'mon', 'doc', 'tham', 'khao'
    ]);
    const phraseNoiseWords = new Set([
      'nguoi', 'moi', 'co', 'ban', 'nhap', 'mon', 'doc', 'tham', 'khao'
    ]);

    const clean = String(query || '')
      .replace(/[.,;:!?()[\]{}<>|/\\+\-=*^%$#@~`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const parts = clean
      .split(' ')
      .map((w) => w.trim())
      .filter(Boolean)
      .filter((w) => !stopWords.has(this._stripVietnamese(w.toLowerCase())));

    if (parts.length === 0) return [];

    const coreTokens = parts.filter((w) => w.length >= 3 && !genericWords.has(this._stripVietnamese(w.toLowerCase())));
    const phraseParts = parts.filter((w) => !phraseNoiseWords.has(this._stripVietnamese(w.toLowerCase())));
    const phraseSource = phraseParts.length >= 2 ? phraseParts : (coreTokens.length >= 2 ? coreTokens : parts);
    const phrases = [];
    if (phraseSource.length >= 2) phrases.push(phraseSource.slice(0, 4).join(' '));
    if (phraseSource.length >= 3) phrases.push(phraseSource.slice(0, 3).join(' '));

    return [...new Set([...phrases, ...coreTokens])];
  }

  static _inferBookSubject(query = '') {
    const normalized = this._stripVietnamese(String(query || '').toLowerCase());

    if (/(lap\s*trinh|python|java|javascript|typescript|sql|du\s*lieu|giai\s*thuat|algorithm|coding)/i.test(normalized)) {
      return 'Lập trình';
    }

    if (/(van\s*hoc|truyen|tieu\s*thuyet|tho|comic|manga|conan|doraemon)/i.test(normalized)) {
      return 'Văn học';
    }

    return null;
  }

  static _buildFallbackArgs(query = '', isNews = false, limit = 10) {
    const keywords = this._cleanKeywords(query);
    if (isNews) {
      return { keywords: keywords.length ? keywords : [query], limit };
    }

    const args = { keywords: keywords.length ? keywords : [query], limit };
    const inferredSubject = this._inferBookSubject(query);
    if (inferredSubject) args.subject = inferredSubject;

    // Heuristic year extraction: "sau 2020", "từ 2018 đến 2022"
    const yearMatches = String(query).match(/\b(19\d{2}|20\d{2})\b/g) || [];
    const years = [...new Set(yearMatches.map((y) => parseInt(y, 10)).filter((n) => Number.isFinite(n)))];
    if (years.length === 1) {
      if (/sau|tu\s+sau|from|after/i.test(this._stripVietnamese(query.toLowerCase()))) {
        args.year_from = years[0];
      } else if (/truoc|before/i.test(this._stripVietnamese(query.toLowerCase()))) {
        args.year_to = years[0];
      }
    }
    if (years.length >= 2) {
      args.year_from = Math.min(...years);
      args.year_to = Math.max(...years);
    }

    return args;
  }

  // ─────────────────────────────────────────────────────────────────
  // TOOL DECLARATIONS — Function Calling Schema cho tìm kiếm thư viện
  // ─────────────────────────────────────────────────────────────────
  static LIBRARY_TOOLS = {
    functionDeclarations: [
      {
        name: 'searchBooks',
        description: 'Chỉ gọi hàm này khi người dùng muốn tìm sách, tài liệu học tập, hoặc văn bản.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: {
              type: 'STRING',
              description: 'Tên sách (ví dụ: "Đắc Nhân Tâm", "Clean Code")'
            },
            author: {
              type: 'STRING',
              description: 'Tên tác giả'
            },
            subject: {
              type: 'STRING',
              description: 'Chủ đề: Lập trình, Văn học, Y học...'
            },
            year_from: {
              type: 'INTEGER',
              description: 'Năm xuất bản sớm nhất (vd: 2020)'
            },
            year_to: {
              type: 'INTEGER',
              description: 'Năm xuất bản muộn nhất'
            },
            limit: {
              type: 'INTEGER',
              description: 'Số lượng kết quả người dùng yêu cầu (ví dụ: "3 quyển sách", "5 cuốn")'
            },
            keywords: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Tuyệt đối CHỈ LẤY DANH TỪ chỉ nội dung/chủ đề. LOẠI BỎ hết các từ nhiễu: "tìm", "tôi", "muốn", "sách", "có", "không", "quyển". Ví dụ gõ "tìm sách lập trình python" thì keywords=["lập trình", "python"].'
            },
            media_type: {
              type: 'STRING',
              description: 'Physical (sách giấy) hoặc Digital (sách điện tử)'
            }
          }
        }
      },
      {
        name: 'searchNews',
        description: 'Chỉ gọi hàm này khi người dùng tìm: Tin tức, Khuyến mãi, Nội quy, Hướng dẫn, Đăng ký',
        parameters: {
          type: 'OBJECT',
          properties: {
            limit: {
              type: 'INTEGER',
              description: 'Số lượng bài viết theo yêu cầu (ví dụ: "3 tin tức mới nhất" -> limit = 3)'
            },
            keywords: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Các từ khóa cốt lõi để tìm tin tức. KHÔNG bao gồm từ nhiễu như "tìm", "xem", "tin", "tức".'
            },
            category: {
              type: 'STRING',
              description: 'Danh mục: sự kiện, khuyến mãi, nội quy...'
            }
          }
        }
      }
    ]
  };

  /**
   * Function Calling Search — Phân tích intent và trả về params chuẩn
   * @param {string} query — Câu hỏi tự nhiên của người dùng
   * @returns {{ function: string, args: object }}
   */
  async functionCallSearch(query) {
    // Fallback thông minh: RegExp nhận diện nhanh
    const isNews = /tin tức|thông báo|sự kiện|nội quy|khuyến mãi|mới nhất/i.test(query);
    const defaultFallback = { 
      function: isNews ? 'searchNews' : 'searchBooks', 
      args: GeminiService._buildFallbackArgs(query, isNews, 10)
    };

    if (!this.genAI) {
      return defaultFallback;
    }

    try {
      const modelWithTools = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        tools: [GeminiService.LIBRARY_TOOLS]
      });

      const result = await modelWithTools.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `Bạn là bộ phân tích truy vấn thư viện chuyên nghiệp.\n\nYêu cầu bắt buộc:\n1) Chỉ chọn 1 hàm phù hợp nhất giữa searchBooks hoặc searchNews.\n2) Không đưa từ nhiễu vào keywords.\n3) Nếu query có dạng chỉ dẫn meta (ví dụ: "trích xuất từ khóa..."), hãy bỏ chỉ dẫn và lấy ý chính thật của người dùng.\n4) Ưu tiên điền title/author/subject khi nhận diện được rõ ràng.\n\nTruy vấn người dùng: "${query}"` }]
        }]
      });

      const candidate = result.response?.candidates?.[0];
      const part = candidate?.content?.parts?.[0];

      if (part?.functionCall) {
        return {
          function: part.functionCall.name,
          args: part.functionCall.args || {}
        };
      }

      console.warn('[GeminiService] functionCallSearch: No function call returned, using fallback');
      const isNews = /tin tức|thông báo|sự kiện|nội quy|khuyến mãi|mới nhất/i.test(query);
      return { 
        function: isNews ? 'searchNews' : 'searchBooks', 
        args: GeminiService._buildFallbackArgs(query, isNews, 10)
      };

    } catch (error) {
      console.error('[GeminiService] functionCallSearch error:', error.message);
      const isNews = /tin tức|thông báo|sự kiện|nội quy|khuyến mãi|mới nhất/i.test(query);
      return { 
        function: isNews ? 'searchNews' : 'searchBooks', 
        args: GeminiService._buildFallbackArgs(query, isNews, 10)
      };
    }
  }

  /**
   * Tóm tắt nội dung ấn phẩm bằng AI
   * @param {string} content — Mô tả ấn phẩm
   * @returns {string|null}
   */
  async summarize(content) {
    if (!this.model) return null;
    try {
      const prompt = `Tóm tắt ngắn gọn (khoảng 100 từ) nội dung cuốn sách sau một cách chuyên nghiệp và hấp dẫn: ${content}`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('[GeminiService] summarize error:', error.message);
      return null;
    }
  }
}

module.exports = new GeminiService();
