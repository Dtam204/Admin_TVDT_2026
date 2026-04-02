const GeminiService = require('../services/gemini.service');

class AdminAIController {
  static async summarize(req, res) {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, message: "Text content is required for summarization" });
      }

      const summary = await GeminiService.summarize(text);
      if (!summary) {
        return res.status(500).json({ success: false, message: "AI failed to generate summary" });
      }

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error("AdminAIController Summarize Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Có thể thêm tính năng generate ISBD ở đây sau
}

module.exports = AdminAIController;
