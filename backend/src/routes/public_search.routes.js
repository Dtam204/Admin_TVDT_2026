const express = require('express');
const { aiSuggest, aiNewsSuggest } = require('../controllers/search.controller');

const router = express.Router();

/**
 * @swagger
 * /api/public/search/ai-suggest:
 *   get:
 *     summary: Tìm kiếm thông minh bằng AI Gemini
 *     tags: [Public Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Câu hỏi hoặc từ khóa tìm kiếm (VD "Sách về lập trình")
 *     responses:
 *       200:
 *         description: Danh sách gợi ý từ AI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Publication'
 *                 ai_interpreted:
 *                   type: object
 */
router.get('/ai-suggest', aiSuggest);

/**
 * @swagger
 * /api/public/search/ai-news-suggest:
 *   get:
 *     summary: Tìm kiếm tin tức thông minh bằng AI Gemini
 *     tags: [Public Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Câu hỏi hoặc từ khóa về tin tức
 *     responses:
 *       200:
 *         description: Danh sách tin tức phù hợp từ AI
 */
router.get('/ai-news-suggest', aiNewsSuggest);

module.exports = router;
