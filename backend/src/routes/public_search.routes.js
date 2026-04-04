const express = require('express');
const publicSearchController = require('../controllers/public_search.controller');
const { aiSuggest, aiNewsSuggest } = require('../controllers/search.controller');

const router = express.Router();

/**
 * @swagger
 * /api/public/search/ai-suggest:
 *   get:
 *     tags: [Public Search]
 *     summary: Tìm kiếm sách thông minh (AI Gemini)
 *     description: Sử dụng AI để hiểu ý định người dùng và tìm kiếm các ấn phẩm phù hợp nhất.
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Nội dung tìm kiếm (ví dụ "Sách về lập trình Python cho người mới")
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Publication' }
 *                     ai_interpreted:
 *                       type: object
 *                       description: Phân tích của AI về câu truy vấn
 *
 * /api/public/search/ai-news-suggest:
 *   get:
 *     tags: [Public Search]
 *     summary: Tìm kiếm tin tức thông minh (AI Gemini)
 *     description: Tìm kiếm các bài viết, tin tức dựa trên câu hỏi tự nhiên của người dùng.
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Nội dung tìm kiếm tin tức
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/News' }
 *
 * /api/public/search/publications:
 *   get:
 *     tags: [Public Search]
 *     summary: Tra cứu ấn phẩm (Cơ bản & Nâng cao)
 *     description: API phục vụ màn hình Tra cứu tài liệu trên Mobile App.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: 'string' }
 *         description: Từ khóa tìm kiếm chung
 *       - in: query
 *         name: title
 *         schema: { type: 'string' }
 *         description: Lọc đích danh theo nhan đề
 *       - in: query
 *         name: author
 *         schema: { type: 'string' }
 *         description: Lọc đích danh theo tác giả
 *       - in: query
 *         name: year
 *         schema: { type: 'integer' }
 *         description: Lọc đích danh theo 1 năm (Dùng cho các Chip năm trên Mobile)
 *       - in: query
 *         name: year_from
 *         schema: { type: 'integer', default: 2005 }
 *       - in: query
 *         name: year_to
 *         schema: { type: 'integer', default: 2026 }
 *       - in: query
 *         name: sort_by
 *         schema: { type: 'string', default: 'default' }
 *     responses:
 *       200:
 *         description: Thành công
 * 
 * /api/public/search/barcode/{barcode}:
 *   get:
 *     tags: [Public Search]
 *     summary: Quét mã ấn phẩm (Barcode/QR)
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Thông tin chi tiết ấn phẩm
 */
router.get('/publications', publicSearchController.searchPublications);
router.get('/barcode/:barcode', publicSearchController.searchByBarcode);
router.get('/ai-suggest', aiSuggest);
router.get('/ai-news-suggest', aiNewsSuggest);

module.exports = router;
