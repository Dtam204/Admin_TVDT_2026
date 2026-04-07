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
      args: { keywords: [query], limit: 10 } 
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
          parts: [{ text: `Bạn là trợ lý tìm kiếm thư viện. Hãy phân tích yêu cầu sau và trích xuất tham số ĐÚNG VỚI chuyên môn mong muốn: "${query}"` }]
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
        args: { keywords: [query], limit: 10 } 
      };

    } catch (error) {
      console.error('[GeminiService] functionCallSearch error:', error.message);
      const isNews = /tin tức|thông báo|sự kiện|nội quy|khuyến mãi|mới nhất/i.test(query);
      return { 
        function: isNews ? 'searchNews' : 'searchBooks', 
        args: { keywords: [query], limit: 10 } 
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
