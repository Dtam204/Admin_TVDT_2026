const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * Service tích hợp Google Gemini AI
 */
class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      console.log("🚀 Gemini AI Service: API Key detected.");
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } else {
      console.error("❌ ERROR: GEMINI_API_KEY is missing in .env!");
    }
  }

  /**
   * Tóm tắt nội dung ấn phẩm dựa trên mô tả hoặc text trích xuất
   */
  async summarize(content) {
    if (!this.model) return "AI Summary is unavailable.";
    try {
      const prompt = `Tóm tắt ngắn gọn (khoảng 100 từ) nội dung cuốn sách sau một cách chuyên nghiệp và hấp dẫn: ${content}`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini Summarize Error:", error.message);
      return null;
    }
  }

  /**
   * Phân tích ý định tìm kiếm (Semantic Search)
   * Chuyển câu hỏi tự nhiên thành các tiêu chí lọc
   */
  async analyzeSearchIntent(query) {
    if (!this.model) return null;
    try {
      const prompt = `Phân tích câu truy vấn tìm kiếm sách: "${query}". 
      Trả về kết quả dạng JSON với các trường: 
      title (tên sách nếu có), 
      author (tác giả nếu có), 
      category (thể loại nếu có), 
      topic (chủ đề chính),
      sentiment (cảm xúc mong muốn, vd: truyền cảm hứng, chuyên sâu, dễ hiểu).
      CHỈ TRẢ VỀ JSON, KHÔNG CÓ GIẢI THÍCH.`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, "").trim();
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Search Analysis Error:", error.message);
      return null;
    }
  }
}

module.exports = new GeminiService();
