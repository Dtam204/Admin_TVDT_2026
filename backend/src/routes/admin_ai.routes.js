/**
 * @swagger
 * /api/admin/ai/summarize:
 *   post:
 *     summary: Tóm tắt nội dung bằng Gemini AI
 *     tags: [Admin Publication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */
const express = require('express');
const router = express.Router();
const GeminiService = require('../../services/gemini.service');

router.post('/summarize', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "Thiếu nội dung" });
    
    const summary = await GeminiService.summarize(content);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
